import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { BrowserWindow } from 'electron';
import { WEBSOCKET_PORT } from './constants';
import {
  DropFileMessage,
  isFileAddedMessage,
  isFileDroppedMessage,
  isInitMessage,
  isResponseMessage,
  Message,
  PromptMessage,
  ResponseMessage,
} from './messages';
import { ResponseCompletedData, ResponseChunkData } from '@/common/types';

class WebSocketManager {
  private static instance: WebSocketManager;
  private wss: WebSocketServer | null = null;
  private mainWindow: BrowserWindow | null = null;
  private clients: Map<string, WebSocket> = new Map();
  private currentResponseMessageId: string | null = null;

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  public initServer(mainWindow: BrowserWindow, port = WEBSOCKET_PORT): void {
    this.mainWindow = mainWindow;
    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('WebSocket client connected');

      ws.on('message', (message) => this.processMessage(ws, message));

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.removeClientConnection(ws);
      });
    });
  }

  public sendPrompt(baseDir: string, prompt: string): void {
    const message: PromptMessage = {
      action: 'prompt',
      prompt,
    };

    this.sendMessage(baseDir, message);
  }

  public dropFile(baseDir: string, filePath: string): void {
    const message: DropFileMessage = {
      action: 'drop-file',
      path: filePath,
    };

    this.sendMessage(baseDir, message);
  }

  private sendMessage = (baseDir: string, message: Message) => {
    const client = this.clients.get(baseDir);
    if (client?.readyState === WebSocket.OPEN) {
      console.log(`Sending message to ${baseDir}`);
      client.send(JSON.stringify(message));
    }
  };

  public closeServer(): void {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }

  private processMessage = (socket: WebSocket, messageJSON: string) => {
    try {
      console.log(`Received message: ${messageJSON}`);

      const message: Message = JSON.parse(messageJSON);

      if (isInitMessage(message)) {
        this.clients.set(message.baseDir, socket);
        console.log(`WebSocket registered for base directory: ${message.baseDir}`);
      } else if (isResponseMessage(message)) {
        const baseDir = this.getBaseDir(socket);
        if (!baseDir) {
          return;
        }
        this.processResponseMessage(baseDir, message);
      } else if (isFileAddedMessage(message)) {
        const baseDir = this.getBaseDir(socket);
        if (!baseDir) {
          return;
        }
        console.log(`Sending file-added event for ${baseDir}`);
        this.mainWindow?.webContents.send('file-added', {
          baseDir: baseDir,
          path: message.path,
          readOnly: message.readOnly,
        });
      } else if (isFileDroppedMessage(message)) {
        const baseDir = this.getBaseDir(socket);
        if (!baseDir) {
          return;
        }
        console.log(`Sending file-dropped event for ${baseDir}`);
        this.mainWindow?.webContents.send('file-dropped', {
          baseDir: baseDir,
          path: message.path,
          readOnly: message.readOnly,
        });
      } else {
        console.error('Unknown message type');
      }
    } catch (error) {
      console.error('WebSocket message parsing error:', error);
    }
  };

  private processResponseMessage = (baseDir: string, message: ResponseMessage) => {
    if (!this.mainWindow) {
      return;
    }

    if (!this.currentResponseMessageId) {
      this.currentResponseMessageId = uuidv4();
    }

    if (!message.finished) {
      console.log(`Sending response chunk to ${baseDir}`);
      const data: ResponseChunkData = {
        messageId: this.currentResponseMessageId,
        baseDir,
        chunk: message.content,
      };
      this.mainWindow.webContents.send('response-chunk', data);
    } else {
      console.log(`Sending response finished to ${baseDir}`);
      const data: ResponseCompletedData = {
        messageId: this.currentResponseMessageId,
        content: message.content,
        baseDir,
        editedFiles: message.editedFiles,
        commitHash: message.commitHash,
        commitMessage: message.commitMessage,
        diff: message.diff,
      };
      this.mainWindow.webContents.send('response-completed', data);
      this.currentResponseMessageId = null;
    }
  };

  private getBaseDir(socket: WebSocket): string | null {
    for (const [baseDir, connection] of this.clients.entries()) {
      if (connection === socket) {
        return baseDir;
      }
    }
    return null;
  }

  private removeClientConnection(ws: WebSocket) {
    for (const [baseDir, connection] of this.clients.entries()) {
      if (connection === ws) {
        this.clients.delete(baseDir);
        console.log(`WebSocket removed for base directory: ${baseDir}`);
        break;
      }
    }
  }
}

export const websocketManager = WebSocketManager.getInstance();
