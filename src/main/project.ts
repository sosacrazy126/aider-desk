import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { BrowserWindow } from 'electron';
import treeKill from 'tree-kill';
import { ContextFile, ModelsData, QuestionData } from '@common/types';
import { EditFormat, MessageAction } from './messages';
import { Connector } from './connector';
import { AIDER_DESKTOP_CONNECTOR_DIR, PYTHON_COMMAND } from './constants';
import logger from './logger';

export class Project {
  private mainWindow: BrowserWindow | null = null;
  private process?: ChildProcessWithoutNullStreams | null = null;
  private connectors: Connector[] = [];
  private currentQuestion: QuestionData | null = null;
  private allTrackedFiles: string[] = [];
  public baseDir: string;
  public contextFiles: ContextFile[] = [];
  public addableFilePaths: string[] = [];
  public models: ModelsData | null = null;

  constructor(mainWindow: BrowserWindow, baseDir: string) {
    this.mainWindow = mainWindow;
    this.baseDir = baseDir;
  }

  public addConnector(connector: Connector) {
    logger.info('Adding connector for base directory:', { baseDir: this.baseDir });
    this.connectors.push(connector);
    if (connector.listenTo.includes('add-file')) {
      this.contextFiles.forEach(connector.sendAddFileMessage);
    }
  }

  public removeConnector(connector: Connector) {
    this.connectors = this.connectors.filter((c) => c !== connector);
  }

  public runAider(options: string, environmentVariables: Record<string, string>): void {
    if (this.process) {
      return;
    }

    const args = ['-m', 'aider.main'];
    if (options) {
      args.push(...options.split(' ').filter((arg) => arg));
    }
    args.push(...['--no-check-update', '--connector', '--no-show-model-warnings']);
    args.push(this.baseDir);

    const env = {
      ...process.env,
      ...environmentVariables,
      PYTHONPATH: AIDER_DESKTOP_CONNECTOR_DIR,
    };

    // Spawn without shell to have direct process control
    this.process = spawn(PYTHON_COMMAND, args, {
      cwd: this.baseDir,
      detached: true,
      env,
    });

    logger.info('Starting Aider...', { baseDir: this.baseDir });
    this.process.stdout.on('data', (data) => {
      const output = data.toString();
      logger.info('Aider output:', { output });
    });

    this.process.stderr.on('data', (data) => {
      logger.error('Aider stderr:', { baseDir: this.baseDir, error: data.toString() });
    });

    this.process.on('close', (code) => {
      logger.info('Aider process exited:', { baseDir: this.baseDir, code });
    });
  }

  public isStarted() {
    return !!this.process;
  }

  public killAider() {
    if (this.process) {
      logger.info('Killing Aider...', { baseDir: this.baseDir });
      try {
        treeKill(this.process.pid!, 'SIGKILL', (err) => {
          if (err) {
            logger.error('Error killing Aider process:', { error: err });
          }
        });
      } catch (error: unknown) {
        logger.error('Error killing Aider process:', { error });
      }
    }
    this.process = null;
  }

  private findMessageConnectors(action: MessageAction): Connector[] {
    return this.connectors.filter((connector) => connector.listenTo.includes(action));
  }

  public sendPrompt(prompt: string, editFormat?: EditFormat): void {
    logger.info('Sending prompt:', { baseDir: this.baseDir, prompt });
    if (this.currentQuestion) {
      this.answerQuestion('n');
    }
    this.findMessageConnectors('prompt').forEach((connector) => connector.sendPromptMessage(prompt, editFormat));
  }

  public answerQuestion(answer: string): void {
    if (!this.currentQuestion) {
      return;
    }

    this.findMessageConnectors('answer-question').forEach((connector) => connector.sendAnswerQuestionMessage(answer));
    this.currentQuestion = null;
  }

  public addFile(contextFile: ContextFile): void {
    logger.info('Adding file:', { path: contextFile.path });
    this.contextFiles.push(contextFile);
    this.findMessageConnectors('add-file').forEach((connector) => connector.sendAddFileMessage(contextFile));

    this.mainWindow?.webContents.send('file-added', {
      baseDir: this.baseDir,
      file: contextFile,
    });
  }

  public dropFile(path: string): void {
    logger.info('Dropping file:', { path });
    this.contextFiles = this.contextFiles.filter((file) => file.path !== path);
    this.findMessageConnectors('drop-file').forEach((connector) => connector.sendDropFileMessage(path));

    this.mainWindow?.webContents.send('file-dropped', {
      baseDir: this.baseDir,
      path,
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

  public setCurrentQuestion(questionData: QuestionData) {
    this.currentQuestion = questionData;
  }

  public setAllTrackedFiles(files: string[]) {
    this.allTrackedFiles = files;
  }

  public setCurrentModels(modelsData: ModelsData) {
    this.models = modelsData;
    this.mainWindow?.webContents.send('set-current-models', this.models);
  }

  public updateMainModel(model: string) {
    logger.info('Updating main model:', model);
    this.findMessageConnectors('set-models').forEach((connector) => connector.sendSetModelsMessage(model, this.models!.weakModel));
  }

  public getAddableFiles(): string[] {
    const contextFilePaths = new Set(this.contextFiles.map((file) => file.path));
    return this.allTrackedFiles.filter((file) => !contextFilePaths.has(file));
  }
}
