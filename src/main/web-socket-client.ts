import WebSocket from 'ws';
import { AddFileMessage, ContextFile, DropFileMessage, Message, MessageAction } from './messages';

export class WebSocketClient {
  socket: WebSocket;
  baseDir: string;
  listenTo: MessageAction[];

  constructor(socket: WebSocket, baseDir: string, listenTo: MessageAction[] = []) {
    this.socket = socket;
    this.baseDir = baseDir;
    this.listenTo = listenTo;
  }

  public sendMessage = (message: Message) => {
    if (this.socket.readyState !== WebSocket.OPEN) {
      console.log('WebSocket client is not connected');
      return;
    }
    console.log(`Sending message to client with baseDir: ${this.baseDir}`);
    this.socket.send(JSON.stringify(message));
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
