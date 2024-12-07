import { ModelsData, UsageReportData } from '@common/types';

export interface Message {
  id: string;
  type: 'prompt' | 'response' | 'loading' | 'models' | 'reflected-message' | 'command-output' | 'log';
  content: string;
}

export interface PromptMessage extends Message {
  type: 'prompt';
  editFormat?: string;
}

export interface ResponseMessage extends Message {
  type: 'response';
  processing: boolean;
  usageReport?: UsageReportData;
}

export interface ReflectedMessage extends Message {
  type: 'reflected-message';
}

export interface LogMessage extends Message {
  type: 'log';
  level: 'info' | 'warning' | 'error';
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

export const isLogMessage = (message: Message): message is LogMessage => {
  return message.type === 'log';
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
