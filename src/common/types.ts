export interface ResponseChunkData {
  messageId: string;
  baseDir: string;
  chunk: string;
  reflectedMessage?: string;
}

export interface ResponseCompletedData {
  messageId: string;
  baseDir: string;
  content: string;
  reflectedMessage?: string;
  editedFiles?: string[];
  commitHash?: string;
  commitMessage?: string;
  diff?: string;
  usageReport?: UsageReportData;
}

export interface CommandOutputData {
  baseDir: string;
  command: string;
  output: string;
}

export interface LogData {
  baseDir: string;
  level: 'info' | 'warning' | 'error' | 'loading';
  message: string;
}

export interface ContextFilesUpdatedData {
  baseDir: string;
  files: ContextFile[];
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
  answerFunction?: (answer: string) => void;
}

export type ContextFileSourceType = 'companion' | 'aider' | 'app' | string;

export interface ContextFile {
  path: string;
  readOnly?: boolean;
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
  weakModel?: string | null;
  architectModel?: string | null;
}

export interface ProjectData {
  active?: boolean;
  baseDir: string;
  settings: ProjectSettings;
}

export interface ModelsData {
  baseDir: string;
  mainModel: string;
  weakModel?: string | null;
  architectModel?: string | null;
  maxChatHistoryTokens?: number;
  info?: Record<string, unknown>;
  error?: string;
}

export interface SettingsData {
  onboardingFinished?: boolean;
  aider: {
    options: string;
    environmentVariables: string;
  };
  models: {
    preferred: string[];
  };
}

export interface UsageReportData {
  sentTokens: number;
  receivedTokens: number;
  messageCost: number;
  totalCost: number;
}

export interface TokensCost {
  tokens: number;
  cost: number;
}

export interface TokensInfoData {
  baseDir: string;
  chatHistory: TokensCost;
  files: Record<string, TokensCost>;
  repoMap: TokensCost;
  systemMessages: TokensCost;
}

export interface FileEdit {
  path: string;
  original: string;
  updated: string;
}
