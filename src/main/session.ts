import path from 'path';
import fs from 'fs/promises';

import { ContextFile, ContextMessage, MessageRole } from '@common/types';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
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
      return false;
    }

    const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
    const ig = ignore().add(gitignoreContent);

    // Make the path relative to the base directory
    const absolutePath = path.resolve(this.project.baseDir, contextFile.path);
    const relativePath = path.relative(this.project.baseDir, absolutePath);

    return ig.ignores(relativePath);
  }

  async addContextFile(contextFile: ContextFile): Promise<void> {
    const alreadyAdded = this.contextFiles.find((file) => file.path === contextFile.path);
    if (alreadyAdded) {
      return;
    }

    if (await this.isFileIgnored(contextFile)) {
      logger.debug('Skipping ignored file:', { path: contextFile.path });
      return;
    }

    this.contextFiles.push({
      ...contextFile,
      readOnly: contextFile.readOnly ?? false,
    });
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
}
