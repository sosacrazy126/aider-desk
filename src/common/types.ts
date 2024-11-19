export interface ResponseChunkData {
  messageId: string;
  baseDir: string;
  chunk: string;
}

export interface ResponseCompletedData {
  messageId: string;
  baseDir: string;
  content: string;
  editedFiles?: string[];
  commitHash?: string;
  commitMessage?: string;
  diff?: string;
}

export interface FileAddedData {
  baseDir: string;
  file: ContextFile;
}

export interface FileDroppedData {
  baseDir: string;
  path: string;
}

export interface AutocompletionData {
  baseDir: string;
  words: string[];
}

export interface ConfirmAskData {
  baseDir: string;
  question: string;
}

export type ContexFileSourceType = 'companion' | 'aider' | 'app' | string;

export interface ContextFile {
  path: string;
  sourceType?: ContexFileSourceType;
  readOnly?: boolean;
}

export interface WindowState {
  width: number;
  height: number;
  x: number | undefined;
  y: number | undefined;
  isMaximized: boolean;
}
