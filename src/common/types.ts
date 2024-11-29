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

export interface ErrorData {
  baseDir: string;
  error: string;
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
  allFiles: string[];
  models: string[];
}

export interface QuestionData {
  baseDir: string;
  text: string;
  subject?: string;
  defaultAnswer: string;
}

export type ContextFileSourceType = 'companion' | 'aider' | 'app' | string;

export interface ContextFile {
  path: string;
  sourceType?: ContextFileSourceType;
  readOnly?: boolean;
  ignored?: boolean;
}

export interface WindowState {
  width: number;
  height: number;
  x: number | undefined;
  y: number | undefined;
  isMaximized: boolean;
}

export interface ProjectSettings {
  mainModel?: string;
}

export interface ProjectData {
  baseDir: string;
  settings: ProjectSettings;
}

export interface ModelsData {
  baseDir: string;
  name: string;
  weakModel: string;
  maxChatHistoryTokens?: number;
  info?: Record<string, unknown>;
  error?: string;
}

export interface SettingsData {
  aider: {
    options: string;
    environmentVariables: string;
  };
  models: {
    preferred: string[];
  };
}

export interface Test {
  propertyA: string;
}

export interface Test2 {
  propertyB: boolean;
}
