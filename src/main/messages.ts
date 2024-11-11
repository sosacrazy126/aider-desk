export interface Message {
  action: 'init' | 'prompt' | 'response' | 'file-added' | 'file-dropped' | 'drop-file';
}

export interface InitMessage {
  action: 'init';
  baseDir: string;
}

export const isInitMessage = (message: Message): message is InitMessage => {
  return typeof message === 'object' && message !== null && 'action' in message && message.action === 'init';
};

export interface PromptMessage extends Message {
  action: 'prompt';
  prompt: string;
}

export interface ResponseMessage extends Message {
  action: 'response';
  content: string;
  finished: boolean;
  editedFiles?: string[];
  commitHash?: string;
  commitMessage?: string;
  diff?: string;
}

export const isResponseMessage = (message: Message): message is ResponseMessage => {
  return typeof message === 'object' && message !== null && 'action' in message && message.action === 'response';
};

export interface FileAddedMessage extends Message {
  action: 'file-added';
  path: string;
  readOnly?: boolean;
}

export const isFileAddedMessage = (message: Message): message is FileAddedMessage => {
  return typeof message === 'object' && message !== null && 'action' in message && message.action === 'file-added';
};

export interface FileDroppedMessage extends Message {
  action: 'file-dropped';
  path: string;
  readOnly?: boolean;
  baseDir: string;
}

export const isFileDroppedMessage = (message: Message): message is FileDroppedMessage => {
  return typeof message === 'object' && message !== null && 'action' in message && message.action === 'file-dropped';
};

export interface DropFileMessage extends Message {
  action: 'drop-file';
  path: string;
}
