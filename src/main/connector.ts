import { Socket } from 'socket.io';
import { ContextFile } from '@common/types';
import { AddFileMessage, AnswerQuestionMessage, DropFileMessage, EditFormat, Message, MessageAction, PromptMessage, SetModelsMessage } from './messages';
import logger from './logger';

export class Connector {
  socket: Socket;
  baseDir: string;
  listenTo: MessageAction[];

  constructor(socket: Socket, baseDir: string, listenTo: MessageAction[] = []) {
    this.socket = socket;
    this.baseDir = baseDir;
    this.listenTo = listenTo;
  }

  private sendMessage = (message: Message) => {
    if (!this.socket.connected) {
      logger.warn('Socket.IO client is not connected');
      return;
    }
    logger.info('Sending message to client:', { baseDir: this.baseDir, messageType: message.action });
    this.socket.emit('message', message);
  };

  public sendPromptMessage(prompt: string, editFormat?: EditFormat): void {
    const message: PromptMessage = {
      action: 'prompt',
      prompt,
      editFormat,
    };
    this.sendMessage(message);
  }

  public sendAnswerQuestionMessage = (answer: string) => {
    const message: AnswerQuestionMessage = {
      action: 'answer-question',
      answer,
    };
    this.sendMessage(message);
  };

  public sendAddFileMessage = (contextFile: ContextFile) => {
    const message: AddFileMessage = {
      action: 'add-file',
      path: contextFile.path,
      readOnly: contextFile.readOnly,
    };
    this.sendMessage(message);
  };

  public sendDropFileMessage = (path: string) => {
    const message: DropFileMessage = {
      action: 'drop-file',
      path,
    };
    this.sendMessage(message);
  };

  public sendSetModelsMessage(mainModel: string, weakModel: string): void {
    const message: SetModelsMessage = {
      action: 'set-models',
      name: mainModel,
      weakModel,
    };
    this.sendMessage(message);
  }
}
