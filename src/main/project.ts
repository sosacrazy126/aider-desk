import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { BrowserWindow } from 'electron';
import { ContextFile, QuestionData } from '@common/types';
import { EditFormat, MessageAction } from './messages';
import { Connector } from './connector';
import { AIDER_COMMAND } from './constants';

export class Project {
  private mainWindow: BrowserWindow | null = null;
  private process?: ChildProcessWithoutNullStreams | null = null;
  private connectors: Connector[] = [];
  private currentQuestion: QuestionData | null = null;
  public baseDir: string;
  public contextFiles: ContextFile[] = [];

  constructor(mainWindow: BrowserWindow, baseDir: string) {
    this.mainWindow = mainWindow;
    this.baseDir = baseDir;
  }

  public addConnector(connector: Connector) {
    console.log(`Adding connector for base directory: ${this.baseDir}`);
    this.connectors.push(connector);
    this.contextFiles.forEach(connector.sendAddFileMessage);
  }

  public removeConnector(connector: Connector) {
    this.connectors = this.connectors.filter((c) => c !== connector);
  }

  public runAider(baseDir: string): void {
    if (this.process) {
      return;
    }

    // Spawn without shell to have direct process control
    this.process = spawn(AIDER_COMMAND, [baseDir], {
      cwd: baseDir,
      detached: true,
    });

    console.log('Starting Aider...');

    this.process.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      const match = output.match(/^\$confirm-ask\$:(.*)$/ms);
      if (match) {
        const message = JSON.parse(match[1]);
        console.log(`Sending confirm-ask message: ${JSON.stringify(message)}`);
        if (this.mainWindow) {
          this.mainWindow.webContents.send('confirm-ask', message);
        }
      }
    });

    this.process.stderr.on('data', (data) => {
      console.error(`Aider stderr (${baseDir}): ${data}`);
    });

    this.process.on('close', (code) => {
      console.log(`Aider process exited with code ${code} (${baseDir})`);
    });
  }

  public isStarted() {
    return !!this.process;
  }

  public killAider() {
    if (this.process) {
      console.log('Killing Aider...', this.baseDir);
      try {
        // Kill the process group
        process.kill(-this.process.pid!, 'SIGKILL');
      } catch (error: unknown) {
        console.error(error);
        // Fallback to direct process termination
        this.process.kill('SIGKILL');
      }
    }
    this.process = null;
  }

  private findMessageConnectors(action: MessageAction): Connector[] {
    return this.connectors.filter((connector) => connector.listenTo.includes(action));
  }

  public sendPrompt(prompt: string, editFormat?: EditFormat): void {
    console.log(`Sending prompt to ${this.baseDir}`, prompt);
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
    console.log(`Adding file: ${contextFile.path}`);
    this.contextFiles.push(contextFile);
    this.findMessageConnectors('add-file').forEach((connector) => connector.sendAddFileMessage(contextFile));

    this.mainWindow?.webContents.send('file-added', {
      baseDir: this.baseDir,
      file: contextFile,
    });
  }

  public dropFile(path: string): void {
    console.log(`Dropping file: ${path}`);
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
      console.log('Failed to load input history:', error);
      return [];
    }
  }

  public setCurrentQuestion(questionData: QuestionData) {
    this.currentQuestion = questionData;
  }
}
