import { ModelsData } from '@common/types';

export interface Message {
  id: string;
  type: 'prompt' | 'response' | 'error' | 'loading' | 'models';
  content: string;
}

export interface PromptMessage extends Message {
  type: 'prompt';
  edit_format?: 'code' | 'ask' | 'architect';
}

export interface ResponseMessage extends Message {
  type: 'response';
  processing: boolean;
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

export const isPromptMessage = (message: Message): message is PromptMessage => {
  return message.type === 'prompt';
};

export const isResponseMessage = (message: Message): message is ResponseMessage => {
  return message.type === 'response';
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
