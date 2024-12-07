import { ModelsData, QuestionData, ResponseChunkData, ResponseCompletedData } from '@common/types';
import { parseUsageReport } from '@common/utils';
import { BrowserWindow } from 'electron';
import { Server, Socket } from 'socket.io';
import { Connector } from 'src/main/connector';
import { v4 as uuidv4 } from 'uuid';
import { SOCKET_PORT } from './constants';
import logger from './logger';
import {
  isAddFileMessage,
  isAskQuestionMessage,
  isDropFileMessage,
  isInitMessage,
  isResponseMessage,
  isSetModelsMessage,
  isUpdateAutocompletionMessage,
  isUpdateContextFilesMessage,
  isUseCommandOutputMessage,
  LogMessage,
  Message,
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

  public init(mainWindow: BrowserWindow, port = SOCKET_PORT): void {
    this.mainWindow = mainWindow;
    this.io = new Server(port, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      logger.info('Socket.IO client connected');

      socket.on('message', (message) => this.processMessage(socket, message));
      socket.on('log', (message) => this.processLogMessage(socket, message));

      socket.on('disconnect', () => {
        logger.info('Socket.IO client disconnected');
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
      logger.debug('Message:', { message });

      if (isInitMessage(message)) {
        const connector = new Connector(socket, message.baseDir, message.listenTo);
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
        this.processResponseMessage(connector.baseDir, message);
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
        const project = projectManager.getProject(connector.baseDir);
        project.updateContextFiles(message.files);
      } else if (isUseCommandOutputMessage(message)) {
        logger.info('Use command output', { message });

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

    if (message.level === 'error' && this.currentResponseMessageId) {
      const data: ResponseCompletedData = {
        messageId: this.currentResponseMessageId,
        content: '',
        baseDir: connector.baseDir,
      };
      this.mainWindow.webContents.send('response-completed', data);
      this.currentResponseMessageId = null;
    }

    this.mainWindow.webContents.send('log', {
      baseDir: connector.baseDir,
      level: message.level,
      message: message.message,
    });
  };

  private processResponseMessage = (baseDir: string, message: ResponseMessage) => {
    if (!this.mainWindow) {
      return;
    }

    if (!this.currentResponseMessageId) {
      this.currentResponseMessageId = uuidv4();
    }

    if (!message.finished) {
      logger.debug(`Sending response chunk to ${baseDir}`);
      const data: ResponseChunkData = {
        messageId: this.currentResponseMessageId,
        baseDir,
        chunk: message.content,
        reflectedMessage: message.reflectedMessage,
      };
      this.mainWindow.webContents.send('response-chunk', data);
    } else {
      logger.info(`Sending response completed to ${baseDir}`);
      logger.debug(`Message data: ${JSON.stringify(message)}`);

      const usageReport = message.usageReport ? parseUsageReport(message.usageReport) : undefined;
      logger.info(`Usage report: ${JSON.stringify(usageReport)}`);
      const data: ResponseCompletedData = {
        messageId: this.currentResponseMessageId,
        content: message.content,
        reflectedMessage: message.reflectedMessage,
        baseDir,
        editedFiles: message.editedFiles,
        commitHash: message.commitHash,
        commitMessage: message.commitMessage,
        diff: message.diff,
        usageReport,
      };
      this.mainWindow.webContents.send('response-completed', data);
      this.currentResponseMessageId = null;

      const project = projectManager.getProject(baseDir);
      project.closeCommandOutput();
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
    const connector = this.connectors.find((c) => c.socket === socket);
    if (!connector) {
      logger.error('Connector not found');
    }
    return connector;
  };
}

export const connectorManager = ConnectorManager.getInstance();
