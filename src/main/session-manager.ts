import path from 'path';
import { promises as fs } from 'fs';

import { ContextFile, ContextMessage, MessageRole, SessionData } from '@common/types';
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

import type { StoredMessage } from '@langchain/core/messages';

export class SessionManager {
  private contextMessages: ContextMessage[];
  private contextFiles: ContextFile[];
  private activeSessionName: string | null = null;

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

  public async save(name?: string, loadMessages?: boolean, loadFiles?: boolean): Promise<SessionData> {
    try {
      name = name || this.activeSessionName || 'default';
      const sessionsDir = path.join(this.project.baseDir, '.aider-desk', 'sessions');
      await fs.mkdir(sessionsDir, { recursive: true });
      const sessionPath = path.join(sessionsDir, `${name}.json`);

      if (loadMessages === undefined || loadFiles === undefined) {
        try {
          const existingSessionData = await this.findSession(name);

          if (existingSessionData) {
            // Only use existing values if the new values are undefined
            if (loadMessages === undefined) {
              loadMessages = existingSessionData.loadMessages;
            }

            if (loadFiles === undefined) {
              loadFiles = existingSessionData.loadFiles;
            }
          }
        } catch (error) {
          logger.error('Failed to read existing session file:', { error });
        }
      }

      // set default values if not provided
      loadMessages = loadMessages ?? true;
      loadFiles = loadFiles ?? false;

      const sessionData = {
        contextMessages: mapChatMessagesToStoredMessages(this.contextMessages),
        contextFiles: this.contextFiles,
        loadMessages,
        loadFiles,
      };

      await fs.writeFile(sessionPath, JSON.stringify(sessionData, null, 2), 'utf8');

      // Set this as the active session
      this.activeSessionName = name;
      await this.saveLastActive(name);

      logger.info(`Session saved to ${sessionPath}`);

      return {
        name,
        active: true,
        loadMessages,
        loadFiles,
        messages: this.contextMessages.length,
        files: this.contextFiles.length,
      };
    } catch (error) {
      logger.error('Failed to save session:', { error });
      throw error;
    }
  }

  public async load(name: string): Promise<void> {
    try {
      const sessionData = await this.findSession(name);

      if (!sessionData) {
        logger.debug('No session found to load:', { name });
        return;
      }

      // Set this as the active session
      this.activeSessionName = name;
      await this.saveLastActive(name);

      if (sessionData.loadMessages && sessionData.contextMessages) {
        // Clear all current messages
        this.project.clearContext();

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

            this.project.sendAddMessage(MessageRole.Assistant, message.text, false);
          } else if (isHumanMessage(message)) {
            this.project.addUserMessage(message.text);
            this.project.sendAddMessage(MessageRole.User, message.text, false);
          }
        }
      }

      if (sessionData.loadFiles && sessionData.contextFiles) {
        // Drop all current files
        this.contextFiles.forEach((contextFile) => {
          this.project.sendDropFile(contextFile);
        });

        this.contextFiles = sessionData.contextFiles;
        this.contextFiles.forEach((contextFile) => {
          this.project.sendAddFile(contextFile);
        });
      }

      logger.info(`Session loaded from ${name} (loadMessages: ${sessionData.loadMessages}, loadFiles: ${sessionData.loadFiles})`);
    } catch (error) {
      logger.error('Failed to load session:', { error });
      throw error;
    }
  }

  public async loadLastActive(): Promise<void> {
    try {
      const sessionsDir = path.join(this.project.baseDir, '.aider-desk', 'sessions');
      const lastActiveSessionPath = path.join(sessionsDir, 'lastActive');
      let name = 'default';

      if (await fileExists(lastActiveSessionPath)) {
        try {
          name = await fs.readFile(lastActiveSessionPath, 'utf8');
          logger.info(`Loading last active session: ${name}`);
        } catch (error) {
          logger.error('Failed to read last active session file:', { error });
        }
      }

      await this.load(name);
    } catch (error) {
      logger.error('Failed to load active session:', { error });
      throw error;
    }
  }

  public getActiveSessionName(): string | null {
    return this.activeSessionName;
  }

  public async getAllSessions(): Promise<SessionData[]> {
    try {
      const sessionsDir = path.join(this.project.baseDir, '.aider-desk', 'sessions');
      await fs.mkdir(sessionsDir, { recursive: true });
      const files = await fs.readdir(sessionsDir);
      const activeSessionName = this.getActiveSessionName();

      const sessions: SessionData[] = [];

      for (const file of files.filter((file) => file.endsWith('.json'))) {
        const sessionName = file.replace('.json', '');

        try {
          const sessionData = await this.findSession(sessionName);
          if (sessionData) {
            sessions.push({
              name: sessionName,
              active: sessionName === activeSessionName,
              loadMessages: sessionData.loadMessages ?? true,
              loadFiles: sessionData.loadFiles ?? true,
              messages: sessionData.contextMessages?.length || 0,
              files: sessionData.contextFiles?.length || 0,
            });
          }
        } catch (error) {
          logger.error('Failed to read session file:', { file, error });
        }
      }

      return sessions;
    } catch (error) {
      logger.error('Failed to list sessions:', { error });
      return [];
    }
  }

  public async findSession(name: string): Promise<
    | (SessionData & {
        contextMessages?: StoredMessage[];
        contextFiles?: ContextFile[];
      })
    | null
  > {
    try {
      const sessionPath = path.join(this.project.baseDir, '.aider-desk', 'sessions', `${name}.json`);

      if (!(await fileExists(sessionPath))) {
        logger.debug('No session file found:', { path: sessionPath });
        return null;
      }

      return JSON.parse(await fs.readFile(sessionPath, 'utf8'));
    } catch (error) {
      logger.error('Failed to get session data:', { name, error });
      return null;
    }
  }

  public async delete(name: string): Promise<void> {
    logger.info('Deleting session:', { name });
    try {
      const sessionPath = path.join(this.project.baseDir, '.aider-desk', 'sessions', `${name}.json`);
      await fs.unlink(sessionPath);
      logger.info(`Session deleted: ${sessionPath}`);

      // Reset active session if we deleted the active one
      if (this.activeSessionName === name) {
        // Get all sessions after deletion
        const sessions = await this.getAllSessions();
        // Set to first available session or 'default'
        this.activeSessionName = sessions.length > 0 ? sessions[0].name : 'default';

        // Update the lastActive file
        await this.saveLastActive(this.activeSessionName);

        logger.info(`Active session set to: ${this.activeSessionName}`);
      }
    } catch (error) {
      logger.error('Failed to delete session:', { error });
      throw error;
    }
  }

  private async saveLastActive(name: string) {
    const lastActiveSessionPath = path.join(this.project.baseDir, '.aider-desk', 'sessions', 'lastActive');
    await fs.writeFile(lastActiveSessionPath, name, 'utf8');
  }
}
