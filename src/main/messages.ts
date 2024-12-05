import { ContextFileSourceType, ContextFile, TokensCost } from '@common/types';

export type MessageAction =
  | 'init'
  | 'prompt'
  | 'response'
  | 'add-file'
  | 'drop-file'
  | 'update-autocompletion'
  | 'ask-question'
  | 'answer-question'
  | 'set-models'
  | 'update-context-files'
  | 'use-command-output'
  | 'run-command'
  | 'tokens-info';

export interface Message {
  action: MessageAction;
}

export interface WarningMessage {
  message: string;
}

export interface ErrorMessage {
  message: string;
}

export interface InitMessage {
  action: 'init';
  baseDir: string;
  contextFiles?: ContextFile[];
  listenTo?: MessageAction[];
}

export const isInitMessage = (message: Message): message is InitMessage => {
  return typeof message === 'object' && message !== null && 'action' in message && message.action === 'init';
};

export type EditFormat = 'code' | 'ask' | 'architect';

export interface PromptMessage extends Message {
  action: 'prompt';
  prompt: string;
  editFormat?: EditFormat;
}

export interface ResponseMessage extends Message {
  action: 'response';
  content: string;
  reflectedMessage?: string;
  finished: boolean;
  usageReport?: string;
  editedFiles?: string[];
  commitHash?: string;
  commitMessage?: string;
  diff?: string;
}

export const isResponseMessage = (message: Message): message is ResponseMessage => {
  return typeof message === 'object' && message !== null && 'action' in message && message.action === 'response';
};

export interface AddFileMessage extends Message {
  action: 'add-file';
  path: string;
  sourceType?: ContextFileSourceType;
  readOnly?: boolean;
}

export const isAddFileMessage = (message: Message): message is AddFileMessage => {
  return typeof message === 'object' && message !== null && 'action' in message && message.action === 'add-file';
};

export interface DropFileMessage extends Message {
  action: 'drop-file';
  path: string;
  readOnly?: boolean;
}

export const isDropFileMessage = (message: Message): message is DropFileMessage => {
  return typeof message === 'object' && message !== null && 'action' in message && message.action === 'drop-file';
};

export interface RunCommandMessage extends Message {
  action: 'run-command';
  command: string;
}

export interface UpdateAutocompletionMessage extends Message {
  action: 'update-autocompletion';
  words: string[];
  allFiles: string[];
  models: string[];
}

export const isUpdateAutocompletionMessage = (message: Message): message is UpdateAutocompletionMessage => {
  return typeof message === 'object' && message !== null && 'action' in message && message.action === 'update-autocompletion';
};

export interface AskQuestionMessage extends Message {
  action: 'ask-question';
  question: string;
  subject?: string;
  defaultAnswer: string;
}

export const isAskQuestionMessage = (message: Message): message is AskQuestionMessage => {
  return typeof message === 'object' && message !== null && 'action' in message && message.action === 'ask-question';
};

export interface AnswerQuestionMessage extends Message {
  action: 'answer-question';
  answer: string;
}

export interface SetModelsMessage extends Message {
  action: 'set-models';
  name: string;
  weakModel: string;
  maxChatHistoryTokens?: number;
  info?: Record<string, unknown>;
  hasError?: boolean;
}

export const isSetModelsMessage = (message: Message): message is SetModelsMessage => {
  return typeof message === 'object' && message !== null && 'action' in message && message.action === 'set-models';
};

export interface UpdateContextFilesMessage extends Message {
  action: 'update-context-files';
  files: ContextFile[];
}

export const isUpdateContextFilesMessage = (message: Message): message is UpdateContextFilesMessage => {
  return typeof message === 'object' && message !== null && 'action' in message && message.action === 'update-context-files';
};

export interface UseCommandOutputMessage extends Message {
  action: 'use-command-output';
  command: string;
  finished: boolean;
}

export const isUseCommandOutputMessage = (message: Message): message is UseCommandOutputMessage => {
  return typeof message === 'object' && message !== null && 'action' in message && message.action === 'use-command-output';
};

export interface TokensInfoMessage extends Message {
  action: 'tokens-info';
  info: {
    files: Record<string, TokensCost>;
    systemMessages: TokensCost;
    chatHistory: TokensCost;
    repoMap: TokensCost;
  };
}

export const isTokensInfoMessage = (message: Message): message is TokensInfoMessage => {
  return typeof message === 'object' && message !== null && 'action' in message && message.action === 'tokens-info';
};
