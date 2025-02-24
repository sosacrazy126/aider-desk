import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import { unlinkSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { BrowserWindow } from 'electron';
import treeKill from 'tree-kill';
import { parseUsageReport } from '@common/utils';
import { ContextFile, FileEdit, ModelsData, QuestionData, ResponseChunkData, ResponseCompletedData } from '@common/types';
import { Store } from './store';
import { EditFormat, MessageAction, ResponseMessage } from './messages';
import { Connector } from './connector';
import { AIDER_DESK_CONNECTOR_DIR, PID_FILES_DIR, PYTHON_COMMAND, SOCKET_PORT } from './constants';
import logger from './logger';

export class Project {
  private mainWindow: BrowserWindow | null = null;
  private store: Store | null = null;
  private process?: ChildProcessWithoutNullStreams | null = null;
  private connectors: Connector[] = [];
  private currentCommand: string | null = null;
  private currentQuestion: QuestionData | null = null;
  private allTrackedFiles: string[] = [];
  private questionAnswers: Map<string, 'y' | 'n'> = new Map();
  private currentResponseMessageId: string | null = null;
  public baseDir: string;
  public contextFiles: ContextFile[] = [];
  public models: ModelsData | null = null;

  constructor(mainWindow: Electron.CrossProcessExports.BrowserWindow, store: Store, baseDir: string) {
    this.mainWindow = mainWindow;
    this.store = store;
    this.baseDir = baseDir;
  }

  public addConnector(connector: Connector) {
    logger.info('Adding connector for base directory:', {
      baseDir: this.baseDir,
    });
    this.connectors.push(connector);
    if (connector.listenTo.includes('add-file')) {
      this.contextFiles.forEach(connector.sendAddFileMessage);
    }
  }

  public removeConnector(connector: Connector) {
    this.connectors = this.connectors.filter((c) => c !== connector);
  }

  private getAiderProcessPidFilePath(): string {
    const hash = createHash('sha256').update(this.baseDir).digest('hex');
    return path.join(PID_FILES_DIR, `${hash}.pid`);
  }

  private async writeAiderProcessPidFile(): Promise<void> {
    if (!this.process?.pid) {
      return;
    }

    try {
      await fs.mkdir(PID_FILES_DIR, { recursive: true });
      await fs.writeFile(this.getAiderProcessPidFilePath(), this.process.pid.toString());
    } catch (error) {
      logger.error('Failed to write PID file:', { error });
    }
  }

  private removeAiderProcessPidFile() {
    try {
      unlinkSync(this.getAiderProcessPidFilePath());
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.error('Failed to remove PID file:', { error });
      }
    }
  }

  private async checkAndCleanupPidFile(): Promise<void> {
    const pidFilePath = this.getAiderProcessPidFilePath();
    try {
      if (await fs.stat(pidFilePath).catch(() => null)) {
        const pid = parseInt(await fs.readFile(pidFilePath, 'utf8'));
        await new Promise<void>((resolve, reject) => {
          treeKill(pid, 'SIGKILL', (err) => {
            if (err && !err.message.includes('No such process')) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
        await fs.unlink(pidFilePath);
      }
    } catch (error) {
      logger.error('Error cleaning up old PID file:', { error });
    }
  }

  public async runAider(options: string, environmentVariables: Record<string, string>, mainModel: string, weakModel?: string | null): Promise<void> {
    if (this.process) {
      return;
    }

    await this.checkAndCleanupPidFile();

    this.currentCommand = null;
    this.currentQuestion = null;

    const args = ['-m', 'connector'];
    if (options) {
      const optionsArgs = (options.match(/(?:[^\s"]+|"[^"]*")+/g) as string[]) || [];
      // remove existing --model defined by user
      const modelIndex = optionsArgs.indexOf('--model');
      if (modelIndex !== -1 && modelIndex + 1 < optionsArgs.length) {
        optionsArgs.splice(modelIndex, 2);
      }
      args.push(...optionsArgs.map((option) => (option.startsWith('"') && option.endsWith('"') ? option.slice(1, -1) : option)));
    }
    args.push(...['--no-check-update', '--no-show-model-warnings']);

    args.push('--model', mainModel);

    if (weakModel) {
      args.push('--weak-model', weakModel);
    }

    logger.info('Running Aider with args:', { args });

    const env = {
      ...process.env,
      ...environmentVariables,
      PYTHONPATH: AIDER_DESK_CONNECTOR_DIR,
      CONNECTOR_SERVER_URL: `http://localhost:${SOCKET_PORT}`,
    };

    // Spawn without shell to have direct process control
    this.process = spawn(PYTHON_COMMAND, args, {
      cwd: this.baseDir,
      detached: false,
      env,
    });

    logger.info('Starting Aider...', { baseDir: this.baseDir });
    this.process.stdout.on('data', (data) => {
      const output = data.toString();
      logger.debug('Aider output:', { output });

      if (this.currentCommand) {
        this.sendCommandOutput(this.currentCommand, output);
      }
    });

    this.process.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.startsWith('Warning:')) {
        logger.debug(data);
        return;
      }
      if (output.startsWith('usage:')) {
        logger.debug(output);
        this.sendLogMessage('error', output.includes('error:') ? output.substring(output.indexOf('error:')) : output);
        return;
      }

      logger.error('Aider stderr:', { baseDir: this.baseDir, error: output });
    });

    this.process.on('close', (code) => {
      logger.info('Aider process exited:', { baseDir: this.baseDir, code });
    });

    void this.writeAiderProcessPidFile();
  }

  public isStarted() {
    return !!this.process;
  }

  public async killAider(): Promise<void> {
    if (this.process) {
      logger.info('Killing Aider...', { baseDir: this.baseDir });
      try {
        await new Promise<void>((resolve, reject) => {
          treeKill(this.process!.pid!, 'SIGKILL', (err) => {
            if (err) {
              logger.error('Error killing Aider process:', { error: err });
              reject(err);
            } else {
              this.removeAiderProcessPidFile();
              resolve();
            }
          });
        });
        this.currentCommand = null;
        this.currentQuestion = null;
        this.currentResponseMessageId = null;
      } catch (error: unknown) {
        logger.error('Error killing Aider process:', { error });
        throw error;
      } finally {
        this.process = null;
      }
    }
  }

  private findMessageConnectors(action: MessageAction): Connector[] {
    return this.connectors.filter((connector) => connector.listenTo.includes(action));
  }

  public sendPrompt(prompt: string, editFormat?: EditFormat): void {
    this.currentResponseMessageId = null;

    logger.info('Sending prompt:', {
      baseDir: this.baseDir,
      prompt,
      editFormat,
    });
    if (this.currentQuestion) {
      this.answerQuestion('n');
    }
    this.findMessageConnectors('prompt').forEach((connector) => connector.sendPromptMessage(prompt, editFormat, this.getArchitectModel()));
  }

  private getArchitectModel(): string | null {
    return this.store?.getProjectSettings(this.baseDir).architectModel || null;
  }

  public processResponseMessage(message: ResponseMessage) {
    if (!this.currentResponseMessageId) {
      this.currentResponseMessageId = uuidv4();
    }

    if (!message.finished) {
      logger.debug(`Sending response chunk to ${this.baseDir}`);
      const data: ResponseChunkData = {
        messageId: this.currentResponseMessageId,
        baseDir: this.baseDir,
        chunk: message.content,
        reflectedMessage: message.reflectedMessage,
      };
      this.mainWindow!.webContents.send('response-chunk', data);
    } else {
      logger.info(`Sending response completed to ${this.baseDir}`);
      logger.debug(`Message data: ${JSON.stringify(message)}`);

      const usageReport = message.usageReport ? parseUsageReport(message.usageReport) : undefined;
      logger.info(`Usage report: ${JSON.stringify(usageReport)}`);
      const data: ResponseCompletedData = {
        messageId: this.currentResponseMessageId,
        content: message.content,
        reflectedMessage: message.reflectedMessage,
        baseDir: this.baseDir,
        editedFiles: message.editedFiles,
        commitHash: message.commitHash,
        commitMessage: message.commitMessage,
        diff: message.diff,
        usageReport,
      };
      this.mainWindow!.webContents.send('response-completed', data);
      this.currentResponseMessageId = null;

      this.closeCommandOutput();
    }
  }

  private getQuestionKey(question: QuestionData) {
    return `${question.text}_${question.subject || ''}`;
  }

  public answerQuestion(answer: string): void {
    if (!this.currentQuestion) {
      return;
    }

    logger.info('Answering question:', {
      baseDir: this.baseDir,
      question: this.currentQuestion,
      answer,
    });

    const yesNoAnswer = answer.toLowerCase() === 'a' || answer.toLowerCase() === 'y' ? 'y' : 'n';
    if (answer.toLowerCase() === 'd' || answer.toLowerCase() === 'a') {
      logger.info('Storing answer for question:', {
        baseDir: this.baseDir,
        question: this.currentQuestion,
        answer,
      });
      this.questionAnswers.set(this.getQuestionKey(this.currentQuestion), yesNoAnswer);
    }

    this.findMessageConnectors('answer-question').forEach((connector) => connector.sendAnswerQuestionMessage(yesNoAnswer));
    this.currentQuestion = null;
  }

  public addFile(contextFile: ContextFile): void {
    logger.info('Adding file:', {
      path: contextFile.path,
      readOnly: contextFile.readOnly,
    });
    const existingFile = this.contextFiles.find((file) => file.path === contextFile.path);
    if (!existingFile) {
      this.contextFiles.push(contextFile);
      this.findMessageConnectors('add-file').forEach((connector) => connector.sendAddFileMessage(contextFile));
    }
  }

  public dropFile(filePath: string): void {
    logger.info('Dropping file:', { path: filePath });
    const file = this.contextFiles.find((f) => f.path === filePath);

    // Check if file is outside project directory
    const absolutePath = path.resolve(this.baseDir, filePath);
    const isOutsideProject = !absolutePath.startsWith(path.resolve(this.baseDir));

    const pathToSend = file?.readOnly || isOutsideProject ? absolutePath : filePath.startsWith(this.baseDir) ? filePath : path.join(this.baseDir, filePath);

    this.contextFiles = this.contextFiles.filter((file) => file.path !== filePath);
    this.findMessageConnectors('drop-file').forEach((connector) => connector.sendDropFileMessage(pathToSend));
  }

  public runCommand(command: string) {
    logger.info('Running command:', { command });
    this.findMessageConnectors('run-command').forEach((connector) => connector.sendRunCommandMessage(command));
  }

  public updateContextFiles(contextFiles: ContextFile[]) {
    this.contextFiles = contextFiles;

    this.mainWindow?.webContents.send('context-files-updated', {
      baseDir: this.baseDir,
      files: contextFiles,
    });
  }

  public async loadInputHistory(): Promise<string[]> {
    try {
      const historyPath = path.join(this.baseDir, '.aider.input.history');
      const content = await fs.readFile(historyPath, 'utf8');

      if (!content) {
        return [];
      }

      const history: string[] = [];
      const lines = content.split('\n');
      let currentInput = '';

      for (const line of lines) {
        if (line.startsWith('# ')) {
          if (currentInput) {
            history.push(currentInput.trim());
            currentInput = '';
          }
        } else if (line.startsWith('+')) {
          currentInput += line.substring(1) + '\n';
        }
      }

      if (currentInput) {
        history.push(currentInput.trim());
      }

      return history.reverse();
    } catch (error) {
      logger.error('Failed to load input history:', { error });
      return [];
    }
  }

  public askQuestion(questionData: QuestionData) {
    this.currentQuestion = questionData;

    const storedAnswer = this.questionAnswers.get(this.getQuestionKey(questionData));

    logger.info('Asking question:', {
      baseDir: this.baseDir,
      question: questionData,
      answer: storedAnswer,
    });
    if (storedAnswer) {
      logger.info('Found stored answer for question:', {
        baseDir: this.baseDir,
        question: questionData,
        answer: storedAnswer,
      });
      // Auto-answer based on stored preference
      this.answerQuestion(storedAnswer);
      return;
    }

    this.mainWindow?.webContents.send('ask-question', questionData);
  }

  public setAllTrackedFiles(files: string[]) {
    this.allTrackedFiles = files;
  }

  public setCurrentModels(modelsData: ModelsData) {
    this.models = {
      ...modelsData,
      architectModel: modelsData.architectModel !== undefined ? modelsData.architectModel : this.getArchitectModel(),
    };
    this.mainWindow?.webContents.send('set-current-models', this.models);
  }

  public updateModels(mainModel: string, weakModel: string | null) {
    logger.info('Updating models:', {
      mainModel,
      weakModel,
    });
    this.findMessageConnectors('set-models').forEach((connector) => connector.sendSetModelsMessage(mainModel, weakModel));
  }

  public setArchitectModel(architectModel: string) {
    logger.info('Setting architect model', {
      architectModel,
    });
    this.setCurrentModels({
      ...this.models!,
      architectModel,
    });
  }

  public getAddableFiles(): string[] {
    const contextFilePaths = new Set(this.contextFiles.map((file) => file.path));
    return this.allTrackedFiles.filter((file) => !contextFilePaths.has(file));
  }

  public openCommandOutput(command: string) {
    this.currentCommand = command;
    this.sendCommandOutput(command, '');
  }

  public closeCommandOutput() {
    this.currentCommand = null;
  }

  private sendCommandOutput(command: string, output: string) {
    this.mainWindow!.webContents.send('command-output', {
      baseDir: this.baseDir,
      command: command,
      output,
    });
  }

  public sendLogMessage(level: string, message: string) {
    if (level === 'error' && this.currentResponseMessageId) {
      const data: ResponseCompletedData = {
        baseDir: this.baseDir,
        messageId: this.currentResponseMessageId,
        content: '',
      };
      this.mainWindow!.webContents.send('response-completed', data);
      this.currentResponseMessageId = null;
    }

    this.mainWindow!.webContents.send('log', {
      baseDir: this.baseDir,
      level,
      message,
    });
  }

  public addMessage(content: string) {
    this.findMessageConnectors('add-message').forEach((connector) => connector.sendAddMessageMessage(content));
  }

  public interruptResponse() {
    logger.info('Interrupting response:', { baseDir: this.baseDir });
    this.findMessageConnectors('interrupt-response').forEach((connector) => connector.sendInterruptResponseMessage());
  }

  public applyEdits(edits: FileEdit[]) {
    logger.info('Applying edits:', { baseDir: this.baseDir, edits });
    this.findMessageConnectors('apply-edits').forEach((connector) => connector.sendApplyEditsMessage(edits));
  }
}
