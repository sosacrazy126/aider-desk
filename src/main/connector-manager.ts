import { ModelsData, QuestionData, TokensInfoData } from '@common/types';
import { BrowserWindow } from 'electron';
import { Server, Socket } from 'socket.io';
import { Connector } from 'src/main/connector';

import { SOCKET_PORT } from './constants';
import logger from './logger';
import {
  isAddFileMessage,
  isAskQuestionMessage,
  isDropFileMessage,
  isInitMessage,
  isResponseMessage,
  isSetModelsMessage,
  isTokensInfoMessage,
  isUpdateAutocompletionMessage,
  isUpdateContextFilesMessage,
  isUseCommandOutputMessage,
  LogMessage,
  Message,
} from './messages';
import { projectManager } from './project-manager';

class ConnectorManager {
  private static instance: ConnectorManager;
  private io: Server | null = null;
  private mainWindow: BrowserWindow | null = null;
  private connectors: Connector[] = [];

  private constructor() {}

  public static getInstance(): ConnectorManager {
    if (!ConnectorManager.instance) {
      ConnectorManager.instance = new ConnectorManager();
    }
    return ConnectorManager.instance;
  }

  public init(mainWindow: BrowserWindow, port = SOCKET_PORT): void {
    this.mainWindow = mainWindow;
    this.io = new Server(port, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      pingTimeout: 120000,
      maxHttpBufferSize: 1e8, // Increase payload size to 100 MB
    });

    this.io.on('connection', (socket) => {
      logger.info('Socket.IO client connected');

      socket.on('message', (message) => this.processMessage(socket, message));
      socket.on('log', (message) => this.processLogMessage(socket, message));

      socket.on('disconnect', () => {
        const connector = this.findConnectorBySocket(socket);
        logger.info('Socket.IO client disconnected', { baseDir: connector?.baseDir });
        this.removeConnector(socket);
      });
    });
  }

  public close(): void {
    if (this.io) {
      this.io.close();
      this.io = null;
    }
  }

  private processMessage = (socket: Socket, message: Message) => {
    try {
      logger.info('Received message from client', { action: message.action });
      logger.debug('Message:', { message: JSON.stringify(message).slice(0, 1000) });

      if (isInitMessage(message)) {
        logger.info('Initializing connector for base directory:', { baseDir: message.baseDir, listenTo: message.listenTo });
        const connector = new Connector(socket, message.baseDir, message.listenTo, message.inputHistoryFile);
        this.connectors.push(connector);

        const project = projectManager.getProject(message.baseDir);
        project.addConnector(connector);

        message.contextFiles?.forEach((file) => project.addFile(file));
        logger.info('Socket.IO registered project for base directory:', { baseDir: message.baseDir });
      } else if (isResponseMessage(message)) {
        const connector = this.findConnectorBySocket(socket);
        if (!connector) {
          return;
        }
        projectManager.getProject(connector.baseDir).processResponseMessage(message);
      } else if (isAddFileMessage(message)) {
        const connector = this.findConnectorBySocket(socket);
        if (!connector) {
          return;
        }
        logger.info('Adding file in project', { baseDir: connector.baseDir });
        projectManager.getProject(connector.baseDir).addFile({
          path: message.path,
          readOnly: message.readOnly,
        });
      } else if (isDropFileMessage(message)) {
        const connector = this.findConnectorBySocket(socket);
        if (!connector) {
          return;
        }
        logger.info('Dropping file in project', { baseDir: connector.baseDir });
        projectManager.getProject(connector.baseDir).dropFile(message.path);
      } else if (isUpdateAutocompletionMessage(message)) {
        const connector = this.findConnectorBySocket(socket);
        if (!connector) {
          return;
        }
        this.mainWindow?.webContents.send('update-autocompletion', {
          baseDir: connector.baseDir,
          words: message.words,
          allFiles: message.allFiles,
          models: message.models,
        });
        projectManager.getProject(connector.baseDir).setAllTrackedFiles(message.allFiles);
      } else if (isAskQuestionMessage(message)) {
        const connector = this.findConnectorBySocket(socket);
        if (!connector) {
          return;
        }
        const questionData: QuestionData = {
          baseDir: connector.baseDir,
          text: message.question,
          subject: message.subject,
          defaultAnswer: message.defaultAnswer,
        };
        projectManager.getProject(connector.baseDir).askQuestion(questionData);
      } else if (isSetModelsMessage(message)) {
        const connector = this.findConnectorBySocket(socket);
        if (!connector) {
          return;
        }
        const modelsData: ModelsData = {
          baseDir: connector.baseDir,
          ...message,
        };

        projectManager.getProject(connector.baseDir).setCurrentModels(modelsData);
      } else if (isUpdateContextFilesMessage(message)) {
        const connector = this.findConnectorBySocket(socket);
        if (!connector) {
          return;
        }
        projectManager.getProject(connector.baseDir).updateContextFiles(message.files);
      } else if (isUseCommandOutputMessage(message)) {
        logger.info('Use command output', { ...message });

        const connector = this.findConnectorBySocket(socket);
        if (!connector || !this.mainWindow) {
          return;
        }
        const project = projectManager.getProject(connector.baseDir);
        if (message.finished) {
          project.closeCommandOutput();
        } else {
          project.openCommandOutput(message.command);
        }
      } else if (isTokensInfoMessage(message)) {
        const connector = this.findConnectorBySocket(socket);
        if (!connector || !this.mainWindow) {
          return;
        }

        const data: TokensInfoData = {
          baseDir: connector.baseDir,
          ...message.info,
        };
        this.mainWindow.webContents.send('update-tokens-info', data);
      } else {
        logger.warn('Unknown message type: ', message);
      }
    } catch (error) {
      logger.error('Socket.IO message parsing error:', { error });
    }
  };

  private processLogMessage = (socket: Socket, message: LogMessage) => {
    const connector = this.findConnectorBySocket(socket);
    if (!connector || !this.mainWindow) {
      return;
    }

    const project = projectManager.getProject(connector.baseDir);
    project.sendLogMessage(message.level, message.message);
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
    const connector = this.connectors.find((c) => c.socket === socket);
    if (!connector) {
      logger.error('Connector not found');
    }
    return connector;
  };
}

export const connectorManager = ConnectorManager.getInstance();
