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
  path: string;
  readOnly?: boolean;
}

export interface FileDroppedData {
  baseDir: string;
  path: string;
  readOnly?: boolean;
}
