import path from 'path';
import { promises as fs } from 'fs';

import { ContextFile, ContextMessage, MessageRole } from '@common/types';
import {
  AIMessage,
  HumanMessage,
  isAIMessage,
  isHumanMessage,
  isToolMessage,
  mapChatMessagesToStoredMessages,
  mapStoredMessagesToChatMessages,
} from '@langchain/core/messages';
import { fileExists } from '@common/utils';
import ignore from 'ignore';

import logger from './logger';
import { Project } from './project';

export class Session {
  private contextMessages: ContextMessage[];
  private contextFiles: ContextFile[];

  constructor(
    private readonly project: Project,
    initialMessages: ContextMessage[] = [],
    initialFiles: ContextFile[] = [],
  ) {
    this.contextMessages = initialMessages;
    this.contextFiles = initialFiles;
  }

  addContextMessage(role: MessageRole, content: string): void;
  addContextMessage(message: ContextMessage): void;
  addContextMessage(roleOrMessage: MessageRole | ContextMessage, content?: string) {
    let message: ContextMessage;

    if (typeof roleOrMessage === 'string') {
      message = roleOrMessage === MessageRole.User ? new HumanMessage(content!) : new AIMessage(content!);
    } else {
      message = roleOrMessage;
    }

    this.contextMessages.push(message);
    logger.debug(`Session: Added ${message.getType()} message. Total messages: ${this.contextMessages.length}`);
  }

  private async isFileIgnored(contextFile: ContextFile): Promise<boolean> {
    if (contextFile.readOnly) {
      // not checking gitignore for read-only files
      return false;
    }

    const gitignorePath = path.join(this.project.baseDir, '.gitignore');

    if (!(await fileExists(gitignorePath))) {
      logger.debug('No .gitignore file found, not checking for ignored files');
      return false;
    }

    const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
    const ig = ignore().add(gitignoreContent);

    // Make the path relative to the base directory
    const absolutePath = path.resolve(this.project.baseDir, contextFile.path);
    const relativePath = path.relative(this.project.baseDir, absolutePath);

    logger.debug(`Checking if file is ignored: ${relativePath}, ${absolutePath}`);

    return ig.ignores(relativePath);
  }

  async addContextFile(contextFile: ContextFile) {
    const alreadyAdded = this.contextFiles.find((file) => file.path === contextFile.path);
    if (alreadyAdded) {
      return false;
    }

    if (await this.isFileIgnored(contextFile)) {
      logger.debug('Skipping ignored file:', { path: contextFile.path });
      return false;
    }

    this.contextFiles.push({
      ...contextFile,
      readOnly: contextFile.readOnly ?? false,
    });

    return true;
  }

  dropContextFile(filePath: string) {
    const file = this.contextFiles.find((f) => f.path === filePath);

    if (file) {
      this.contextFiles = this.contextFiles.filter((f) => f !== file);
    }

    return file;
  }

  setContextFiles(contextFiles: ContextFile[]) {
    this.contextFiles = contextFiles;
  }

  getContextFiles(): ContextFile[] {
    return [...this.contextFiles];
  }

  getContextMessages(): ContextMessage[] {
    return [...this.contextMessages];
  }

  clearMessages() {
    this.contextMessages = [];
  }

  public filterUserAndAssistantMessages(contextMessages: ContextMessage[] = this.contextMessages): { role: MessageRole; content: string }[] {
    return contextMessages
      .filter((message) => isAIMessage(message) || isHumanMessage(message))
      .map((message) => ({
        role: isAIMessage(message) ? MessageRole.Assistant : MessageRole.User,
        content: message.text,
      }));
  }

  public async save(name = 'default'): Promise<void> {
    try {
      const sessionData = {
        contextMessages: mapChatMessagesToStoredMessages(this.contextMessages),
        contextFiles: this.contextFiles,
      };

      const sessionsDir = path.join(this.project.baseDir, '.aider-desk', 'sessions');
      await fs.mkdir(sessionsDir, { recursive: true });
      const sessionPath = path.join(sessionsDir, `${name}.json`);
      await fs.writeFile(sessionPath, JSON.stringify(sessionData, null, 2), 'utf8');
      logger.info(`Session saved to ${sessionPath}`);
    } catch (error) {
      logger.error('Failed to save session:', { error });
      throw error;
    }
  }

  public async load(name = 'default', loadMessages = false, loadFiles = false): Promise<void> {
    try {
      const sessionPath = path.join(this.project.baseDir, '.aider-desk', 'sessions', `${name}.json`);

      if (!(await fileExists(sessionPath))) {
        logger.debug('No session file found to load:', { path: sessionPath });
        return;
      }

      const sessionData = JSON.parse(await fs.readFile(sessionPath, 'utf8'));

      if (loadMessages && sessionData.contextMessages) {
        this.contextMessages = mapStoredMessagesToChatMessages(sessionData.contextMessages);

        // Add messages to the UI
        for (let i = 0; i < this.contextMessages.length; i++) {
          const message = this.contextMessages[i];

          if (isAIMessage(message)) {
            this.project.processResponseMessage({
              action: 'response',
              content: message.text,
              finished: true,
            });

            // Handle tool calls if present
            if (message.tool_calls?.length) {
              for (const toolCall of message.tool_calls) {
                const [serverName, toolName] = toolCall.name.split('-');

                // Look for corresponding tool response in next message
                if (i + 1 < this.contextMessages.length) {
                  const nextMessage = this.contextMessages[i + 1];
                  if (isToolMessage(nextMessage) && nextMessage.tool_call_id === toolCall.id) {
                    this.project.addToolMessage(toolCall.id!, serverName, toolName, toolCall.args, nextMessage.text);
                    i++; // Skip the tool response message
                  }
                }
              }
            }
          } else if (isHumanMessage(message)) {
            this.project.addUserMessage(message.text);
          }
        }
      } else {
        // Clear messages if not loading them
        this.contextMessages = [];
      }

      if (loadFiles && sessionData.contextFiles) {
        this.contextFiles = sessionData.contextFiles;
      } else {
        // Clear files if not loading them
        this.contextFiles = [];
      }

      logger.info(`Session loaded from ${sessionPath} (loadMessages: ${loadMessages}, loadFiles: ${loadFiles})`);
    } catch (error) {
      logger.error('Failed to load session:', { error });
      throw error;
    }
  }
}
