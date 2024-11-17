import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { BrowserWindow } from 'electron';
import { ContextFile } from './messages';
import { AIDER_COMMAND } from './constants';
import { WebSocketClient } from './web-socket-client';

export class Project {
  private mainWindow: BrowserWindow | null = null;
  private process?: ChildProcessWithoutNullStreams;
  private clients: WebSocketClient[] = [];
  public baseDir: string;
  public contextFiles: ContextFile[] = [];

  constructor(mainWindow: BrowserWindow, baseDir: string) {
    this.mainWindow = mainWindow;
    this.baseDir = baseDir;
  }

  public addClient(client: WebSocketClient) {
    this.clients.push(client);
    this.contextFiles.forEach(client.sendAddFileMessage);
  }

  public removeClient(client: WebSocketClient) {
    this.clients = this.clients.filter((c) => c !== client);
  }

  public runAider(baseDir: string): void {
    const process = spawn(AIDER_COMMAND, [baseDir], {
      cwd: baseDir,
      shell: true,
    });

    process.stdout.on('data', (data) => {
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

    process.stderr.on('data', (data) => {
      console.error(`Aider stderr (${baseDir}): ${data}`);
    });

    process.on('close', (code) => {
      console.log(`Aider process exited with code ${code} (${baseDir})`);
    });

    this.process = process;
  }

  public isStarted() {
    return !!this.process;
  }

  public killAider() {
    this.process?.kill();
  }

  public addFile(contextFile: ContextFile): void {
    console.log(`Adding file: ${contextFile.path}`);
    this.contextFiles.push(contextFile);
    this.clients.filter((client) => client.listenTo.includes('add-file')).forEach((client) => client.sendAddFileMessage(contextFile));

    this.mainWindow?.webContents.send('file-added', {
      baseDir: this.baseDir,
      path: contextFile.path,
      readOnly: contextFile.readOnly,
    });
  }

  public dropFile(path: string): void {
    this.contextFiles = this.contextFiles.filter((file) => file.path !== path);
    this.clients.filter((client) => client.listenTo.includes('drop-file')).forEach((client) => client.sendDropFileMessage(path));

    this.mainWindow?.webContents.send('file-dropped', {
      baseDir: this.baseDir,
      path,
    });
  }
}
