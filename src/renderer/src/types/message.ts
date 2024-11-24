export interface Message {
  id: string;
  type: 'prompt' | 'response' | 'response-error' | 'loading';
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

export interface ResponseErrorMessage extends Message {
  type: 'response-error';
}

export interface LoadingMessage extends Message {
  type: 'loading';
}

export const isPromptMessage = (message: Message): message is PromptMessage => {
  return message.type === 'prompt';
};

export const isResponseMessage = (message: Message): message is ResponseMessage => {
  return message.type === 'response';
};

export const isResponseErrorMessage = (message: Message): message is ResponseErrorMessage => {
  return message.type === 'response-error';
};

export const isLoadingMessage = (message: Message): message is LoadingMessage => {
  return message.type === 'loading';
};
