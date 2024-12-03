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
  private currentCommand: string | null = null;
  private currentQuestion: QuestionData | null = null;
  private allTrackedFiles: string[] = [];
  private questionAnswers: Map<string, 'y' | 'n'> = new Map();
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

  public runAider(options: string, environmentVariables: Record<string, string>, model?: string): void {
    if (this.process) {
      return;
    }

    this.currentCommand = null;
    this.currentQuestion = null;

    const args = ['-m', 'aider.main'];
    if (options) {
      const optionsArgs = (options.match(/(?:[^\s"]+|"[^"]*")+/g) as string[]) || [];
      if (model) {
        // Only remove existing --model if we're adding a new one
        const modelIndex = optionsArgs.indexOf('--model');
        if (modelIndex !== -1 && modelIndex + 1 < optionsArgs.length) {
          optionsArgs.splice(modelIndex, 2);
        }
      }
      args.push(...optionsArgs.map((option) => (option.startsWith('"') && option.endsWith('"') ? option.slice(1, -1) : option)));
    }
    args.push(...['--no-check-update', '--connector', '--no-show-model-warnings']);
    args.push(this.baseDir);

    logger.info('Running Aider with args:', { args });

    if (model) {
      args.push('--model', model);
    }

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

      if (this.currentCommand) {
        this.sendCommandOutput(this.currentCommand, output);
      }
    });

    this.process.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.startsWith('Warning:')) {
        return;
      }
      if (output.startsWith('usage:')) {
        this.mainWindow?.webContents.send('error', {
          baseDir: this.baseDir,
          error: output.includes('error:') ? output.substring(output.indexOf('error:')) : output,
        });
        return;
      }

      logger.error('Aider stderr:', { baseDir: this.baseDir, error: output });
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

  private getQuestionKey(question: QuestionData) {
    return `${question.text}_${question.subject || ''}`;
  }

  public answerQuestion(answer: string): void {
    if (!this.currentQuestion) {
      return;
    }

    logger.info('Answering question:', { baseDir: this.baseDir, question: this.currentQuestion, answer });

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
    logger.info('Adding file:', { path: contextFile.path, readOnly: contextFile.readOnly });
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

    const pathToSend = file?.readOnly || isOutsideProject ? absolutePath : filePath;

    this.contextFiles = this.contextFiles.filter((file) => file.path !== filePath);
    this.findMessageConnectors('drop-file').forEach((connector) => connector.sendDropFileMessage(pathToSend));
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

    logger.info('Asking question:', { baseDir: this.baseDir, question: questionData, answer: storedAnswer });
    if (storedAnswer) {
      logger.info('Found stored answer for question:', { baseDir: this.baseDir, question: questionData, answer: storedAnswer });
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
}
