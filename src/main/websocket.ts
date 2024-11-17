import { BrowserWindow } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import WebSocket, { WebSocketServer } from 'ws';
import { WEBSOCKET_PORT } from './constants';
import {
  EditFormat,
  isAddFileMessage,
  isDropFileMessage,
  isInitMessage,
  isResponseMessage,
  isUpdateAutocompletionMessage,
  Message,
  PromptMessage,
  ResponseMessage,
} from './messages';
import { projectManager } from './project-manager';
import { WebSocketClient } from './web-socket-client';
import { ResponseChunkData, ResponseCompletedData } from '@/common/types';

class WebSocketManager {
  private static instance: WebSocketManager;
  private wss: WebSocketServer | null = null;
  private mainWindow: BrowserWindow | null = null;
  private clients: WebSocketClient[] = [];
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

  public sendPrompt(baseDir: string, prompt: string, editFormat?: EditFormat): void {
    const message: PromptMessage = {
      action: 'prompt',
      prompt,
      editFormat,
    };

    this.clients
      .filter((client) => client.baseDir === baseDir)
      .filter((client) => client.listenTo.includes('prompt'))
      .forEach((client) => client.sendMessage(message));
  }

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
        const client = new WebSocketClient(socket, message.baseDir, message.listenTo);
        this.clients.push(client);

        const project = projectManager.getProject(message.baseDir);
        project.addClient(client);

        message.openFiles?.forEach((file) => project.addFile(file));
        console.log(`WebSocket registered project for base directory: ${message.baseDir}`);
      } else if (isResponseMessage(message)) {
        const client = this.findClientBySocket(socket);
        if (!client) {
          return;
        }
        this.processResponseMessage(client.baseDir, message);
      } else if (isAddFileMessage(message)) {
        const client = this.findClientBySocket(socket);
        if (!client) {
          console.log('No client found', this.clients);
          return;
        }
        console.log(`Adding file in project ${client.baseDir}`);
        projectManager.getProject(client.baseDir).addFile({
          path: message.path,
          readOnly: message.readOnly,
          sourceType: message.sourceType,
        });
      } else if (isDropFileMessage(message)) {
        const client = this.findClientBySocket(socket);
        if (!client) {
          return;
        }
        console.log(`Dropping file in project ${client.baseDir}`);
        projectManager.getProject(client.baseDir).dropFile(message.path);
      } else if (isUpdateAutocompletionMessage(message)) {
        const client = this.findClientBySocket(socket);
        if (!client) {
          return;
        }
        this.mainWindow?.webContents.send('update-autocompletion', {
          baseDir: client.baseDir,
          words: message.words,
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

  private removeClientConnection = (socket: WebSocket) => {
    const client = this.findClientBySocket(socket);
    if (!client) {
      return;
    }

    const project = projectManager.getProject(client.baseDir);
    project.removeClient(client);

    this.clients = this.clients.filter((c) => c !== client);
  };

  private findClientBySocket = (socket: WebSocket): WebSocketClient | undefined => {
    return this.clients.find((c) => c.socket === socket);
  };
}

export const websocketManager = WebSocketManager.getInstance();
