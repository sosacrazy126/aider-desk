import { Socket } from 'socket.io';
import { AddFileMessage, DropFileMessage, Message, MessageAction } from './messages';
import { ContextFile } from '@/common/types';

export class Connector {
  socket: Socket;
  baseDir: string;
  listenTo: MessageAction[];

  constructor(socket: Socket, baseDir: string, listenTo: MessageAction[] = []) {
    this.socket = socket;
    this.baseDir = baseDir;
    this.listenTo = listenTo;
  }

  public sendMessage = (message: Message) => {
    if (!this.socket.connected) {
      console.log('Socket.IO client is not connected');
      return;
    }
    console.log(`Sending message to client with baseDir: ${this.baseDir}`);
    this.socket.emit('message', message);
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
}
