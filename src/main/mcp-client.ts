import { McpServerConfig, McpTool, UsageReportData } from '@common/types';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { StructuredTool, tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { jsonSchemaToZod } from '@n8n/json-schema-to-zod';
import { v4 as uuidv4 } from 'uuid';
import { delay } from '@common/utils';

import logger from './logger';
import { Store } from './store';
import { Project } from './project';

const PROVIDER_MODELS = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-7-sonnet-20250219',
};

const MODEL_PRICING_MAP = {
  'gpt-4o-mini': {
    inputCost: 0.15, // per million tokens
    outputCost: 0.6, // per million tokens
  },
  'claude-3-7-sonnet-20250219': {
    inputCost: 3.0, // per million tokens
    outputCost: 15.0, // per million tokens
  },
};

type TextContent =
  | string
  | {
      type: 'text';
      text: string;
    };

type ClientHolder = {
  client: Client;
  serverName: string;
  tools: McpTool[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isTextContent = (content: any): content is TextContent => content?.type === 'text' || typeof content === 'string';

const extractTextContent = (content: unknown): string => {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .filter(isTextContent)
      .map((c) => (typeof c === 'string' ? c : c.text))
      .join('\n\n');
  }

  if (typeof content === 'object' && content !== null && 'content' in content) {
    return extractTextContent((content as { content: unknown }).content);
  }

  return '';
};

const createAiderTool = () => {
  return tool(
    async (params: { prompt: string }) => {
      logger.info('Aider tool called with params:', params);
      // This is a noop tool that just returns the prompt
      return params.prompt;
    },
    {
      name: 'aider',
      description: 'Use the Aider AI pair programming assistant to perform coding tasks',
      schema: z.object({
        prompt: z.string().describe('The prompt in natural language to send to Aider for coding assistance including <OriginalPrompt>.'),
      }),
    },
  );
};

const calculateCost = (model: string, sentTokens: number, receivedTokens: number) => {
  const modelCost = MODEL_PRICING_MAP[model];
  if (!modelCost) {
    return 0;
  }
  return (sentTokens * modelCost.inputCost + receivedTokens * modelCost.outputCost) / 1000000;
};

export class McpClient {
  private store: Store;
  private currentInitId: string | null = null;
  private clients: ClientHolder[] = [];
  private lastToolCallTime: number = 0;
  private currentProjectBaseDir: string | null = null;
  private isInterrupted: boolean = false;

  constructor(store: Store) {
    this.store = store;
  }

  async init(project?: Project, initId = uuidv4()) {
    try {
      this.currentInitId = initId;
      await this.closeClients();
      const clients: ClientHolder[] = [];

      const { mcpConfig } = this.store.getSettings();

      // Initialize each MCP server
      for (const [serverName, serverConfig] of Object.entries(mcpConfig.mcpServers)) {
        const clientHolder = await this.initMcpClient(serverName, this.interpolateServerConfig(serverConfig, project));

        if (this.currentInitId !== initId) {
          return;
        }
        clients.push(clientHolder);
      }

      this.clients = clients;
      this.currentProjectBaseDir = project?.baseDir || null;
    } catch (error) {
      logger.error('MCP Client initialization failed:', error);
      throw error;
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
    const { mcpConfig } = this.store.getSettings();
    const { provider, anthropicApiKey, openAiApiKey } = mcpConfig;

    if (provider === 'anthropic') {
      if (!anthropicApiKey) {
        throw new Error('Anthropic API key is required');
      }

      return new ChatAnthropic({
        model: PROVIDER_MODELS[provider],
        temperature: 0,
        maxTokens: 1000,
        apiKey: anthropicApiKey,
      });
    } else if (provider === 'openai') {
      if (!openAiApiKey) {
        throw new Error('OpenAI API key is required');
      }

      return new ChatOpenAI({
        model: PROVIDER_MODELS[provider],
        temperature: 0,
        maxTokens: 1000,
        apiKey: openAiApiKey,
      });
    } else {
      throw new Error(`Unsupported MCP provider: ${provider}`);
    }
  }

  async getMcpServerTools(name: string, config: McpServerConfig, project?: Project): Promise<McpTool[] | null> {
    try {
      const clientHolder = await this.initMcpClient(name, this.interpolateServerConfig(config, project));
      const tools = clientHolder.tools;
      await clientHolder.client.close();
      return tools;
    } catch (error) {
      logger.error('Error getting MCP server tools:', error);
      return null;
    }
  }

  async runPrompt(project: Project, prompt: string): Promise<string | null> {
    const { mcpConfig } = this.store.getSettings();
    logger.debug('McpConfig:', mcpConfig);

    // Reset interruption flag
    this.isInterrupted = false;

    // Check if we need to reinitialize for a different project
    if (this.currentProjectBaseDir !== project.baseDir) {
      logger.info(`Reinitializing MCP clients for project: ${project.baseDir}`);
      await this.init(project, uuidv4());
    }

    // Get MCP server tools
    const mcpServerTools = this.clients
      .filter((clientHolder) => !mcpConfig.disabledServers.includes(clientHolder.serverName))
      .flatMap((clientHolder) => clientHolder.tools.map((tool) => convertMpcToolToLangchainTool(project, clientHolder.client, tool)));

    if (!mcpServerTools.length) {
      logger.info('No tools found for prompt, returning original prompt');
      return prompt;
    }

    // Add the Aider tool
    const aiderTool = createAiderTool();
    const allTools = [...mcpServerTools, aiderTool];

    logger.info(`Running prompt with ${allTools.length} tools.`);
    logger.debug('Tools:', {
      prompt,
      tools: allTools.map((tool) => tool.name),
    });

    try {
      const llmWithTools = this.createLlm().bindTools(allTools);
      const toolsByName: { [key: string]: StructuredTool } = {};
      allTools.forEach((tool) => {
        toolsByName[tool.name] = tool;
      });

      const messages = [new SystemMessage(mcpConfig.systemPrompt), new HumanMessage(`<OriginalPrompt>${prompt}</OriginalPrompt>`)];
      const usageReport: UsageReportData = {
        sentTokens: 0,
        receivedTokens: 0,
        messageCost: 0,
        totalCost: 0,
        mcpToolsCost: 0,
      };

      let iteration = 0;

      while (iteration < mcpConfig.maxIterations) {
        iteration++;
        logger.debug(`Running prompt iteration ${iteration}`, { messages });

        // Get LLM response which may contain tool calls
        const aiMessage = await llmWithTools.invoke(messages);

        // Check for interruption
        if (this.checkInterrupted(project, usageReport)) {
          return null;
        }

        // Update usage report
        usageReport.sentTokens += aiMessage.usage_metadata?.input_tokens ?? 0;
        usageReport.receivedTokens += aiMessage.usage_metadata?.output_tokens ?? 0;
        usageReport.mcpToolsCost = calculateCost(PROVIDER_MODELS[mcpConfig.provider], usageReport.sentTokens, usageReport.receivedTokens);

        // If no tool calls, check if there's content to send
        if (!aiMessage.tool_calls?.length) {
          const textContent = extractTextContent(aiMessage.content);

          if (textContent) {
            logger.info(`Sending final response: ${textContent}`);

            project.processResponseMessage({
              action: 'response',
              content: textContent,
              finished: true,
              usageReport,
            });

            // Push messages to the aider's chat history
            project.addMessage(prompt, 'user', false);
            project.addMessage(textContent, 'assistant');

            return null;
          } else {
            break;
          }
        }

        // Check if Aider tool is being called
        const aiderToolCall = aiMessage.tool_calls.find((call) => call.name === 'aider');
        if (aiderToolCall) {
          if (iteration === 1) {
            // If Aider tool is called for the first iteration don't send anything
            return prompt;
          }

          logger.debug('Aider tool called. Sending prompt to Aider.');
          // If Aider tool is called, use its prompt as the response
          const aiderPrompt = aiderToolCall.args.prompt as string;
          project.sendToolMessage('aider', { prompt: aiderPrompt }, undefined, usageReport);

          return aiderPrompt;
        }

        // Add AI message to messages
        messages.push(aiMessage);

        for (const toolCall of aiMessage.tool_calls) {
          // Check for interruption before each tool call
          if (this.checkInterrupted(project, usageReport)) {
            return null;
          }

          // Calculate how much time to wait based on the minimum time between tool calls
          const now = Date.now();
          const elapsedSinceLastCall = now - this.lastToolCallTime;
          const remainingDelay = Math.max(0, mcpConfig.minTimeBetweenToolCalls - elapsedSinceLastCall);

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
            return null;
          }

          project.sendToolMessage(toolCall.name, toolCall.args);

          try {
            const toolResponse = await selectedTool.invoke(toolCall);

            logger.debug(`Tool ${toolCall.name} returned response`, {
              toolResponse,
            });
            if (!toolResponse) {
              logger.warn(`Tool ${toolCall.name} didn't return a response`);
              return null;
            }

            // Add tool message to messages
            messages.push(toolResponse);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Error invoking tool ${toolCall.name}:`, error);

            // Send log message about the tool error
            project.sendLogMessage('error', `Tool ${toolCall.name} failed: ${errorMessage}`);

            // Add user message to messages for next iteration
            messages.push(new HumanMessage(errorMessage));
          }

          // Update the last tool call time after the delay
          this.lastToolCallTime = Date.now();
        }
      }

      // If no Aider tool was called after max iterations, do nothing
      project.sendLogMessage('info', 'Max iterations for MCP tools reached. Increase the max iterations in the settings.');
      return null;
    } catch (error) {
      logger.error('Error running prompt:', error);
      if (error instanceof Error && error.message.includes('API key is required')) {
        project.sendLogMessage('error', `Error running MCP servers. ${error.message}. Configure it in the Settings -> MCP Config tab.`);
      } else {
        project.sendLogMessage('error', `Error running MCP servers: ${error}`);
      }
      throw error;
    }
  }

  private interpolateServerConfig(serverConfig: McpServerConfig, project?: Project): McpServerConfig {
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
    const tools = (await client.listTools()) as unknown as { tools: McpTool[] };
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

const convertMpcToolToLangchainTool = (project: Project, client: Client, toolDef: McpTool): StructuredTool => {
  return tool(
    async (params: unknown) => {
      const response = await client.callTool({
        name: toolDef.name,
        arguments: params as Record<string, unknown>,
      });

      logger.debug(`Tool ${toolDef.name} returned response`, { response });

      const extractContent = (response) => {
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

      const content = extractContent(response);

      if (content) {
        project.sendToolMessage(toolDef.name, undefined, content);
      }

      return content;
    },
    {
      name: toolDef.name,
      description: toolDef.description ?? '',
      schema: jsonSchemaToZod(toolDef.inputSchema),
    },
  );
};
