import { ModelsData } from '@common/types';

export interface Message {
  id: string;
  type: 'prompt' | 'response' | 'warning' | 'error' | 'loading' | 'models' | 'reflected-message' | 'command-output';
  content: string;
}

export interface PromptMessage extends Message {
  type: 'prompt';
  editFormat?: string;
}

export interface ResponseMessage extends Message {
  type: 'response';
  processing: boolean;
}

export interface ReflectedMessage extends Message {
  type: 'reflected-message';
}

export interface WarningMessage extends Message {
  type: 'warning';
}

export interface ErrorMessage extends Message {
  type: 'error';
}

export interface LoadingMessage extends Message {
  type: 'loading';
}

export interface ModelsMessage extends Message {
  type: 'models';
  models: ModelsData;
}

export interface CommandOutputMessage extends Message {
  type: 'command-output';
  command: string;
}

export const isPromptMessage = (message: Message): message is PromptMessage => {
  return message.type === 'prompt';
};

export const isResponseMessage = (message: Message): message is ResponseMessage => {
  return message.type === 'response';
};

export const isWarningMessage = (message: Message): message is WarningMessage => {
  return message.type === 'warning';
};

export const isErrorMessage = (message: Message): message is ErrorMessage => {
  return message.type === 'error';
};

export const isLoadingMessage = (message: Message): message is LoadingMessage => {
  return message.type === 'loading';
};

export const isModelsMessage = (message: Message): message is ModelsMessage => {
  return message.type === 'models';
};

export const isReflectedMessage = (message: Message): message is ReflectedMessage => {
  return message.type === 'reflected-message';
};

export const isCommandOutputMessage = (message: Message): message is CommandOutputMessage => {
  return message.type === 'command-output';
};
