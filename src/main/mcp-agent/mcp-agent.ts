import fs from 'fs/promises';
import path from 'path';

import { ContextFile, ContextMessage, McpServerConfig, McpTool, UsageReportData } from '@common/types';
import { ChatAnthropic } from '@langchain/anthropic';
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { StructuredTool, tool } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatDeepSeek } from '@langchain/deepseek';
import { BedrockChat } from '@langchain/community/chat_models/bedrock';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { jsonSchemaToZod } from '@n8n/json-schema-to-zod';
import { v4 as uuidv4 } from 'uuid';
import { delay } from '@common/utils';
import { BaseMessage } from '@langchain/core/dist/messages/base';
import {
  getActiveProvider,
  isAnthropicProvider,
  isBedrockProvider,
  isDeepseekProvider,
  isGeminiProvider,
  isOpenAiCompatibleProvider,
  isOpenAiProvider,
  LlmProvider,
} from '@common/llm-providers';
import { BaseChatModel } from '@langchain/core/dist/language_models/chat_models';

import logger from '../logger';
import { Store } from '../store';
import { Project } from '../project';

import { calculateCost, isTextContent } from './utils';
import { createAiderTools } from './tools/aider';

import type { JsonSchema } from '@n8n/json-schema-to-zod';

// increasing timeout for MCP client requests
const MCP_CLIENT_TIMEOUT = 600_000;

type ClientHolder = {
  client: Client;
  serverName: string;
  tools: McpTool[];
};

export class McpAgent {
  private store: Store;
  private currentInitId: string | null = null;
  private initializedForProject: Project | null = null;
  private clients: ClientHolder[] = [];
  private lastToolCallTime: number = 0;
  private isInterrupted: boolean = false;

  constructor(store: Store) {
    this.store = store;
  }

  async init(project: Project | null = this.initializedForProject, initId = uuidv4()) {
    // Set the current init ID to track this specific initialization process
    this.currentInitId = initId;
    try {
      const clients: ClientHolder[] = [];
      const { mcpAgent } = this.store.getSettings();

      await this.closeClients();

      // Initialize each MCP server
      for (const [serverName, serverConfig] of Object.entries(mcpAgent.mcpServers)) {
        try {
          const clientHolder = await this.initMcpClient(serverName, this.interpolateServerConfig(serverConfig, project));

          if (this.currentInitId !== initId) {
            // If initId changed during async operation, stop initialization
            logger.info(`MCP initialization cancelled for server ${serverName} due to new init request.`);
            await this.closeClients(); // Ensure partially initialized clients are closed
            return;
          }
          clients.push(clientHolder);
        } catch (error) {
          logger.error(`MCP Client initialization failed for server: ${serverName}`, error);
          // Optionally notify the user in the UI about the specific failure
          project?.addLogMessage('error', `Failed to initialize MCP server: ${serverName}. Check logs for details.`);
        }
      }

      this.clients = clients;
      this.initializedForProject = project;
    } finally {
      // Clear the init ID only if it matches the ID of this init call
      // This prevents a newer init call from clearing the ID of an older, still running init
      if (this.currentInitId === initId) {
        this.currentInitId = null;
      }
    }
  }

  private async closeClients() {
    for (const clientHolder of this.clients) {
      try {
        await clientHolder.client.close();
      } catch (error) {
        logger.error('Error closing MCP client:', error);
      }
    }
    this.clients = [];
  }

  private createLlm() {
    const { mcpAgent } = this.store.getSettings();
    const { providers, maxTokens } = mcpAgent;
    const provider = getActiveProvider(providers);

    if (!provider) {
      throw new Error('No active MCP provider found');
    }

    if (isAnthropicProvider(provider)) {
      if (!provider.apiKey) {
        throw new Error('Anthropic API key is required');
      }
      return new ChatAnthropic({
        model: provider.model,
        temperature: 0,
        maxTokens: maxTokens,
        apiKey: provider.apiKey,
      });
    } else if (isOpenAiProvider(provider)) {
      if (!provider.apiKey) {
        throw new Error('OpenAI API key is required');
      }
      return new ChatOpenAI({
        model: provider.model,
        // o3-mini does not support temperature
        temperature: provider.model === 'o3-mini' ? undefined : 0,
        maxTokens: maxTokens,
        apiKey: provider.apiKey,
      });
    } else if (isGeminiProvider(provider)) {
      if (!provider.apiKey) {
        throw new Error('Gemini API key is required');
      }
      return new ChatGoogleGenerativeAI({
        model: provider.model,
        temperature: 0,
        maxOutputTokens: maxTokens,
        apiKey: provider.apiKey,
      });
    } else if (isDeepseekProvider(provider)) {
      if (!provider.apiKey) {
        throw new Error('Deepseek API key is required');
      }
      return new ChatDeepSeek({
        model: provider.model,
        temperature: 0,
        maxTokens: maxTokens,
        apiKey: provider.apiKey,
      });
    } else if (isOpenAiCompatibleProvider(provider)) {
      if (!provider.apiKey) {
        throw new Error('API key is required for OpenAI Compatible provider');
      }
      if (!provider.baseUrl) {
        throw new Error('Base URL is required for OpenAI Compatible provider');
      }
      if (!provider.model) {
        throw new Error('Model name is required for OpenAI Compatible provider');
      }
      return new ChatOpenAI({
        model: provider.model,
        temperature: 0,
        maxTokens: maxTokens,
        apiKey: provider.apiKey,
        configuration: {
          baseURL: provider.baseUrl,
        },
        onFailedAttempt: (error) => {
          if (error.message.includes('404 No endpoints found that support tool use')) {
            // when OpenRouter does not support tool use
            throw error;
          }

          logger.error('OpenAI Compatible provider failed attempt:', error);
        },
      });
    } else if (isBedrockProvider(provider)) {
      if (!provider.region) {
        throw new Error('AWS region is required for Bedrock. You can set it in the MCP settings.');
      }

      if (!provider.accessKeyId && !provider.secretAccessKey && !process.env.AWS_PROFILE) {
        throw new Error('Either AWS_PROFILE environment variable or accessKeyId/secretAccessKey must be provided for Bedrock');
      }

      const credentials =
        provider.accessKeyId && provider.secretAccessKey
          ? {
              accessKeyId: provider.accessKeyId,
              secretAccessKey: provider.secretAccessKey,
            }
          : undefined;

      return new BedrockChat({
        model: provider.model,
        region: provider.region,
        credentials,
        temperature: 0,
        maxTokens: maxTokens,
      }) as BaseChatModel;
    } else {
      throw new Error(`Unsupported MCP provider: ${JSON.stringify(provider)}`);
    }
  }

  async reloadMcpServer(serverName: string, config: McpServerConfig, project: Project | null = this.initializedForProject): Promise<McpTool[] | null> {
    try {
      const newClient = await this.initMcpClient(serverName, this.interpolateServerConfig(config, project));

      const oldClientIndex = this.clients.findIndex((client) => client.serverName === serverName);
      if (oldClientIndex !== -1) {
        const oldClient = this.clients[oldClientIndex];
        try {
          await oldClient.client.close();
          logger.info(`Closed old MCP client for server: ${serverName}`);
        } catch (closeError) {
          logger.error(`Error closing old MCP client for server ${serverName}:`, closeError);
        }
        this.clients[oldClientIndex] = newClient;
        logger.debug(`Replaced MCP client for server: ${serverName}`);
      }

      return newClient.tools;
    } catch (error) {
      logger.error(`Error reloading MCP server ${serverName}:`, error);
      project?.addLogMessage('error', `Failed to reload MCP server: ${serverName}. Check logs for details.`);
      return null;
    }
  }

  async getMcpServerTools(serverName: string): Promise<McpTool[] | null> {
    // Wait for any ongoing initialization to complete
    while (this.currentInitId) {
      logger.debug(`MCP Agent is initializing (ID: ${this.currentInitId}), waiting...`);
      await delay(100); // Wait for 100ms before checking again
    }

    const clientHolder = this.clients.find((client) => client.serverName === serverName);
    return clientHolder ? clientHolder.tools : null;
  }

  private async getFileSections(files: ContextFile[], project: Project): Promise<string[]> {
    // Common binary file extensions to exclude

    const BINARY_EXTENSIONS = new Set([
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.bmp',
      '.tiff',
      '.ico', // Images
      '.mp3',
      '.wav',
      '.ogg',
      '.flac', // Audio
      '.mp4',
      '.mov',
      '.avi',
      '.mkv', // Video
      '.zip',
      '.tar',
      '.gz',
      '.7z', // Archives
      '.pdf',
      '.doc',
      '.docx',
      '.xls',
      '.xlsx', // Documents
      '.exe',
      '.dll',
      '.so', // Binaries
    ]);

    const filesWithContent = await Promise.all(
      files.map(async (file) => {
        try {
          const filePath = path.resolve(project.baseDir, file.path);
          const ext = path.extname(filePath).toLowerCase();

          // Skip known binary extensions
          if (BINARY_EXTENSIONS.has(ext)) {
            logger.debug(`Skipping binary file: ${file.path}`);
            return null;
          }

          // Read file as text
          const content = await fs.readFile(filePath, 'utf8');
          return {
            path: file.path,
            content,
            readOnly: file.readOnly,
          };
        } catch (error) {
          logger.error('Error reading context file:', {
            path: file.path,
            error,
          });
          return null;
        }
      }),
    );

    return filesWithContent.filter(Boolean).map((file) => {
      const filePath = path.isAbsolute(file!.path) ? path.relative(project.baseDir, file!.path) : file!.path;
      return `File: ${filePath}\n\`\`\`\n${file!.content}\n\`\`\`\n\n`;
    });
  }

  private async getContextFilesMessages(project: Project): Promise<BaseMessage[]> {
    const { mcpAgent } = this.store.getSettings();
    const messages: BaseMessage[] = [];

    if (mcpAgent.includeContextFiles) {
      const contextFiles = project.getContextFiles();
      if (contextFiles.length > 0) {
        // Separate readonly and editable files
        const [readOnlyFiles, editableFiles] = contextFiles.reduce(
          ([readOnly, editable], file) => (file.readOnly ? [[...readOnly, file], editable] : [readOnly, [...editable, file]]),
          [[], []] as [ContextFile[], ContextFile[]],
        );

        // Process readonly files first
        if (readOnlyFiles.length > 0) {
          const fileSections = await this.getFileSections(readOnlyFiles, project);
          if (fileSections.length > 0) {
            messages.push(
              new HumanMessage('Here are some READ ONLY files, provided for your reference. Do not try to edit these files!\n\n' + fileSections.join('\n\n')),
            );
            messages.push(new AIMessage('Ok, I will use these files as references and will not try to edit them.'));
          }
        }

        // Process editable files
        if (editableFiles.length > 0) {
          const fileSections = await this.getFileSections(editableFiles, project);
          if (fileSections.length > 0) {
            messages.push(new HumanMessage('These are files that can be edited, if needed.\n\n' + fileSections.join('\n\n')));
            messages.push(new AIMessage('OK, I understand that I can update those files, but only when needed.'));
          }
        }
      }
    }

    return messages;
  }

  async runAgent(project: Project, prompt: string): Promise<ContextMessage[]> {
    // Wait for any ongoing initialization to complete
    while (this.currentInitId) {
      logger.debug(`MCP Agent is initializing (ID: ${this.currentInitId}), waiting...`);
      await delay(100); // Wait for 100ms before checking again
    }

    const { mcpAgent } = this.store.getSettings();
    logger.debug('McpConfig:', mcpAgent);

    // Reset interruption flag
    this.isInterrupted = false;

    // Track new messages created during this run
    const newMessages: ContextMessage[] = [];
    const enabledClients = this.clients.filter((clientHolder) => !mcpAgent.disabledServers.includes(clientHolder.serverName));
    const messages = await this.prepareMessages(project);

    newMessages.push(new HumanMessage(prompt));

    // Check if we need to reinitialize for a different project
    if (this.initializedForProject?.baseDir !== project.baseDir) {
      logger.info(`Reinitializing MCP clients for project: ${project.baseDir}`);
      try {
        await this.init(project, uuidv4());
      } catch (error) {
        logger.error('Error reinitializing MCP clients:', error);
        project.addLogMessage('error', `Error reinitializing MCP clients: ${error}`);
        return [];
      }
    }

    // Get MCP server tools
    const mcpServerTools = enabledClients.flatMap((clientHolder) =>
      clientHolder.tools
        .filter((tool) => !mcpAgent.disabledTools.includes(`${clientHolder.serverName}-${tool.name}`))
        .map((tool) => convertMpcToolToLangchainTool(clientHolder.serverName, clientHolder.client, tool, getActiveProvider(mcpAgent.providers)!)),
    );

    // Add Aider tools if enabled
    const allTools = [...mcpServerTools];
    if (mcpAgent.useAiderTools) {
      const aiderTools = createAiderTools(project);
      allTools.push(...aiderTools);
    }

    logger.info(`Running prompt with ${allTools.length} tools.`);
    logger.debug('Tools:', {
      tools: allTools.map((tool) => tool.name),
    });

    const usageReport: UsageReportData = {
      sentTokens: 0,
      receivedTokens: 0,
      messageCost: 0,
      mcpAgentTotalCost: 0,
    };

    try {
      const baseChatModel = this.createLlm();
      const llmWithTools = baseChatModel.bindTools!(allTools);
      const toolsByName: { [key: string]: StructuredTool } = {};
      allTools.forEach((tool) => {
        toolsByName[tool.name] = tool;
      });

      let iteration = 0;

      while (iteration < mcpAgent.maxIterations) {
        iteration++;
        logger.debug(`Running prompt iteration ${iteration}`, { messages });

        // Get LLM response which may contain tool calls
        const aiMessage = await llmWithTools.invoke([...messages, ...newMessages]);

        // Update usage report
        const sentTokens = aiMessage.usage_metadata?.input_tokens ?? aiMessage.response_metadata?.usage?.input_tokens ?? 0;
        const receivedTokens = aiMessage.usage_metadata?.output_tokens ?? aiMessage.response_metadata?.usage?.output_tokens ?? 0;

        usageReport.sentTokens = sentTokens;
        usageReport.receivedTokens = receivedTokens;
        usageReport.messageCost = calculateCost(getActiveProvider(mcpAgent.providers)!, sentTokens, receivedTokens);
        usageReport.mcpAgentTotalCost = project.mcpAgentTotalCost + usageReport.messageCost;

        // Check for interruption
        if (this.checkInterrupted(project, usageReport)) {
          return newMessages;
        }

        // Add AI message to messages
        newMessages.push(aiMessage);

        logger.debug(`Tool calls: ${aiMessage.tool_calls?.length}, message: ${JSON.stringify(aiMessage.content)}`);

        const textContent = aiMessage.text;
        if (textContent) {
          project.processResponseMessage({
            action: 'response',
            content: textContent,
            finished: true,
            usageReport,
          });
          project.addLogMessage('loading');
        }

        if (!aiMessage.tool_calls?.length) {
          return newMessages;
        }

        for (let toolIndex = 0; toolIndex < aiMessage.tool_calls.length; toolIndex++) {
          const toolCall = aiMessage.tool_calls[toolIndex];
          // Check for interruption before each tool call
          if (this.checkInterrupted(project, usageReport)) {
            return newMessages;
          }

          // Calculate how much time to wait based on the minimum time between tool calls
          const now = Date.now();
          const elapsedSinceLastCall = now - this.lastToolCallTime;
          const remainingDelay = Math.max(0, mcpAgent.minTimeBetweenToolCalls - elapsedSinceLastCall);

          if (remainingDelay > 0) {
            await delay(remainingDelay);
          }

          const selectedTool = toolsByName[toolCall.name];
          if (!selectedTool) {
            logger.error(`Tool ${toolCall.name} not found`);
            continue;
          }

          // Check for interruption before sending tool message
          if (this.checkInterrupted(project, usageReport)) {
            return newMessages;
          }

          if (toolCall.id === undefined) {
            // if tool call id is not defined, generate a new one so ToolMessage type is properly created
            toolCall.id = `call_${toolIndex}_${uuidv4()}`;
          }

          const [serverName, toolName] = this.extractServerNameToolName(toolCall.name);
          project.addToolMessage(toolCall.id!, serverName, toolName, toolCall.args);

          try {
            const toolMessage: ToolMessage | null = await selectedTool.invoke(toolCall);

            logger.debug(`Tool ${toolCall.name} returned response`, {
              toolMessage,
            });
            if (!toolMessage) {
              logger.warn(`Tool ${toolCall.name} didn't return a response`);
              return newMessages;
            }

            project.addToolMessage(toolCall.id!, serverName, toolName, undefined, toolMessage.text, usageReport);

            // Add tool message to messages
            newMessages.push(toolMessage);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Error invoking tool ${toolCall.name}:`, error);

            // Send log message about the tool error
            project.addLogMessage('error', `Tool ${toolCall.name} failed: ${errorMessage}`);
            project.addToolMessage(toolCall.id!, serverName, toolName, undefined, errorMessage);

            // Add user message to messages for next iteration
            const errorHumanMessage = new HumanMessage(errorMessage);
            newMessages.push(errorHumanMessage);
          }

          // Update the last tool call time after the delay
          this.lastToolCallTime = Date.now();
        }
      }

      if (iteration >= mcpAgent.maxIterations) {
        // If no Aider tool was called after max iterations, do nothing
        project.addLogMessage('info', 'Max iterations for MCP tools reached. Increase the max iterations in the settings.');
      }

      return newMessages;
    } catch (error) {
      logger.error('Error running prompt:', error);
      if (error instanceof Error && error.message.includes('API key is required')) {
        project.addLogMessage('error', `Error running MCP servers. ${error.message}. Configure it in the Settings -> MCP Config tab.`);
      } else {
        project.addLogMessage('error', `Error running MCP servers: ${error instanceof Error ? error.message : String(error)}`);
      }
      throw error;
    } finally {
      project.processResponseMessage({
        action: 'response',
        content: '',
        finished: true,
        usageReport,
      });
    }
  }

  private getSystemMessage(project: Project, systemPrompt: string): string {
    const currentDate = new Date().toISOString();
    const osInfo = `${process.platform} ${process.arch}`;
    return `${systemPrompt}

Project Directory: ${project.baseDir}
Current Date/Time: ${currentDate}
Operating System: ${osInfo}`;
  }

  private async prepareMessages(project: Project): Promise<readonly BaseMessage[]> {
    const { mcpAgent } = this.store.getSettings();
    const systemMessageContent = this.getSystemMessage(project, mcpAgent.systemPrompt);
    const messages = [new SystemMessage(systemMessageContent), ...project.getContextMessages()];

    if (mcpAgent.includeContextFiles) {
      // Get and store new context files messages
      const contextFilesMessages = await this.getContextFilesMessages(project);
      messages.push(...contextFilesMessages);
    }

    return messages;
  }

  private interpolateServerConfig(serverConfig: McpServerConfig, project: Project | null): McpServerConfig {
    const config = JSON.parse(JSON.stringify(serverConfig)) as McpServerConfig;

    const interpolateValue = (value: string): string => {
      return value.replace(/\${projectDir}/g, project?.baseDir || '.');
    };

    if (config.env) {
      const newEnv: Record<string, string> = {};

      Object.keys(config.env).forEach((key) => {
        if (typeof config.env![key] === 'string') {
          newEnv[key] = interpolateValue(config.env![key]);
        } else {
          newEnv[key] = config.env![key];
        }
      });

      config.env = newEnv;
    }

    config.args = config.args.map(interpolateValue);

    return config;
  }

  private extractServerNameToolName(toolCallName: string): [string, string] {
    if (toolCallName.startsWith('aider-')) {
      return ['aider', toolCallName.slice(6)];
    }

    // Find the first matching client's server name that is a prefix of the tool call name
    const matchingClient = this.clients.find((clientHolder) => toolCallName.startsWith(`${clientHolder.serverName}-`));

    if (!matchingClient) {
      logger.warn(`No matching server found for tool call: ${toolCallName}`);
      return ['unknown', toolCallName];
    }

    // Remove the server name prefix and underscore
    const toolName = toolCallName.slice(matchingClient.serverName.length + 1);
    return [matchingClient.serverName, toolName];
  }

  private checkInterrupted(project: Project, usageReport?: UsageReportData): boolean {
    if (this.isInterrupted) {
      logger.info('Prompt processing interrupted');
      project.processResponseMessage({
        action: 'response',
        content: '',
        finished: true,
        usageReport,
      });
      return true;
    }
    return false;
  }

  public interrupt() {
    logger.info('Interrupting MCP client');
    this.isInterrupted = true;
  }

  private async initMcpClient(serverName: string, serverConfig: McpServerConfig): Promise<ClientHolder> {
    logger.info(`Initializing MCP client for server: ${serverName}`);

    logger.debug(`Server configuration: ${JSON.stringify(serverConfig)}`);

    // NOTE: Some servers (e.g. Brave) seem to require PATH to be set.
    const env = { ...serverConfig.env };
    if (!env.PATH) {
      env.PATH = process.env.PATH || '';
    }

    const transport = new StdioClientTransport({
      command: serverConfig.command,
      args: serverConfig.args,
      env,
    });

    const client = new Client(
      {
        name: 'aider-desk-client',
        version: '1.0.0',
      },
      {
        capabilities: {
          prompts: {},
          resources: {},
          tools: {},
        },
      },
    );

    logger.debug(`Connecting to MCP server: ${serverName}`);
    await client.connect(transport);
    logger.debug(`Connected to MCP server: ${serverName}`);

    // Get tools from this server
    logger.debug(`Fetching tools for MCP server: ${serverName}`);
    const tools = (await client.listTools(undefined, {
      timeout: MCP_CLIENT_TIMEOUT,
    })) as unknown as { tools: McpTool[] };
    logger.debug(`Found ${tools.tools.length} tools for MCP server: ${serverName}`);

    const clientHolder: ClientHolder = {
      client,
      serverName,
      tools: tools.tools.map((tool) => ({
        ...tool,
        serverName: serverName,
      })),
    };

    logger.info(`MCP client initialized successfully for server: ${serverName}`);
    return clientHolder;
  }
}

const convertMpcToolToLangchainTool = (serverName: string, client: Client, toolDef: McpTool, provider: LlmProvider): StructuredTool => {
  const normalizeSchemaForProvider = (schema: JsonSchema): JsonSchema => {
    // Deepseek uses OpenAI compatible API, so no specific normalization needed for now.
    // If specific needs arise, add them here.
    const normalized = JSON.parse(JSON.stringify(schema));

    if (provider.name === 'gemini') {
      if (normalized.properties) {
        for (const key of Object.keys(normalized.properties)) {
          // gemini does not like "default" in the schema
          if (normalized.properties[key].default !== undefined) {
            delete normalized.properties[key].default;
          }
        }
        if (Object.keys(normalized.properties).length === 0) {
          // gemini requires at least one property in the schema
          normalized.properties = {
            placeholder: {
              type: 'string',
              description: 'Placeholder property to satisfy Gemini schema requirements',
            },
          };
        }
      }
    }

    return normalized;
  };

  logger.debug(`Converting MCP tool to Langchain tool: ${toolDef.name}`, toolDef);

  return tool(
    async (params: unknown) => {
      try {
        const response = await client.callTool(
          {
            name: toolDef.name,
            arguments: params as Record<string, unknown>,
          },
          undefined,
          {
            timeout: MCP_CLIENT_TIMEOUT,
          },
        );

        logger.debug(`Tool ${toolDef.name} returned response`, { response });

        const extractContent = (response): string | null => {
          if (!response?.content) {
            return null;
          } else if (Array.isArray(response.content)) {
            return (
              response.content
                .filter(isTextContent)
                .map((textContent) => (typeof textContent === 'string' ? textContent : textContent.text))
                .join('\n\n') ?? null
            );
          } else {
            return response.content;
          }
        };

        return extractContent(response);
      } catch (error) {
        logger.error(`Error calling tool ${toolDef.name}:`, error);
        return `Error calling tool: ${(error as Error).message}`;
      }
    },
    {
      name: `${serverName}-${toolDef.name}`,
      description: toolDef.description ?? '',
      schema: jsonSchemaToZod(normalizeSchemaForProvider(toolDef.inputSchema)),
    },
  );
};
