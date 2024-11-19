import { BrowserWindow } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { Server, Socket } from 'socket.io';
import { Connector } from 'src/main/connector';
import { ResponseChunkData, ResponseCompletedData } from '@common/types';
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

class ConnectorManager {
  private static instance: ConnectorManager;
  private io: Server | null = null;
  private mainWindow: BrowserWindow | null = null;
  private connectors: Connector[] = [];
  private currentResponseMessageId: string | null = null;

  private constructor() {}

  public static getInstance(): ConnectorManager {
    if (!ConnectorManager.instance) {
      ConnectorManager.instance = new ConnectorManager();
    }
    return ConnectorManager.instance;
  }

  public init(mainWindow: BrowserWindow, port = WEBSOCKET_PORT): void {
    this.mainWindow = mainWindow;
    this.io = new Server(port, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      console.log('Socket.IO client connected');

      socket.on('message', (message) => this.processMessage(socket, message));

      socket.on('disconnect', () => {
        console.log('Socket.IO client disconnected');
        this.removeConnector(socket);
      });
    });
  }

  public sendPrompt(baseDir: string, prompt: string, editFormat?: EditFormat): void {
    const message: PromptMessage = {
      action: 'prompt',
      prompt,
      editFormat,
    };

    this.connectors
      .filter((connector) => connector.baseDir === baseDir)
      .filter((connector) => connector.listenTo.includes('prompt'))
      .forEach((connector) => connector.sendMessage(message));
  }

  public close(): void {
    if (this.io) {
      this.io.close();
      this.io = null;
    }
  }

  private processMessage = (socket: Socket, message: Message) => {
    try {
      console.log('Received message:', message);

      if (isInitMessage(message)) {
        const connector = new Connector(socket, message.baseDir, message.listenTo);
        this.connectors.push(connector);

        const project = projectManager.getProject(message.baseDir);
        project.addConnector(connector);

        message.openFiles?.forEach((file) => project.addFile(file));
        console.log(`Socket.IO registered project for base directory: ${message.baseDir}`);
      } else if (isResponseMessage(message)) {
        const connector = this.findConnectorBySocket(socket);
        if (!connector) {
          return;
        }
        this.processResponseMessage(connector.baseDir, message);
      } else if (isAddFileMessage(message)) {
        const connector = this.findConnectorBySocket(socket);
        if (!connector) {
          console.log('No connector found', this.connectors);
          return;
        }
        console.log(`Adding file in project ${connector.baseDir}`);
        projectManager.getProject(connector.baseDir).addFile({
          path: message.path,
          readOnly: message.readOnly,
          sourceType: message.sourceType,
        });
      } else if (isDropFileMessage(message)) {
        const connector = this.findConnectorBySocket(socket);
        if (!connector) {
          return;
        }
        console.log(`Dropping file in project ${connector.baseDir}`);
        projectManager.getProject(connector.baseDir).dropFile(message.path);
      } else if (isUpdateAutocompletionMessage(message)) {
        const connector = this.findConnectorBySocket(socket);
        if (!connector) {
          return;
        }
        this.mainWindow?.webContents.send('update-autocompletion', {
          baseDir: connector.baseDir,
          words: message.words,
        });
      } else {
        setTimeout(() => {
          console.log('Sending answer-question message');
          socket.emit('message', {
            action: 'answer-question',
            answer: 'n',
          });
        }, 5000);
        console.error('Unknown message type');
      }
    } catch (error) {
      console.error('Socket.IO message parsing error:', error);
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

  private removeConnector = (socket: Socket) => {
    const connector = this.findConnectorBySocket(socket);
    if (!connector) {
      return;
    }

    const project = projectManager.getProject(connector.baseDir);
    project.removeConnector(connector);

    this.connectors = this.connectors.filter((c) => c !== connector);
  };

  private findConnectorBySocket = (socket: Socket): Connector | undefined => {
    return this.connectors.find((c) => c.socket === socket);
  };
}

export const connectorManager = ConnectorManager.getInstance();
