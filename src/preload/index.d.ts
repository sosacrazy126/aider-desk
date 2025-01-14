import {
  AutocompletionData,
  ContextFilesUpdatedData,
  ModelsData,
  ProjectData,
  ProjectSettings,
  QuestionData,
  ResponseChunkData,
  ResponseCompletedData,
  SettingsData,
  TokensInfoData,
} from '../common/types';
import type { ElectronAPI } from '@electron-toolkit/preload';

export interface ApplicationAPI {
  loadSettings: () => Promise<SettingsData>;
  saveSettings: (settings: SettingsData) => Promise<void>;
  startProject: (baseDir: string) => void;
  stopProject: (baseDir: string) => void;
  restartProject: (baseDir: string) => void;
  sendPrompt: (baseDir: string, prompt: string, editFormat?: string) => void;
  answerQuestion: (baseDir: string, answer: string) => void;
  loadInputHistory: (baseDir: string) => Promise<string[]>;
  dialog: {
    showOpenDialog: (options: Electron.OpenDialogSyncOptions) => Promise<Electron.OpenDialogReturnValue>;
  };
  loadProjects: () => Promise<ProjectData[]>;
  saveProjects: (projects: ProjectData[]) => Promise<void>;
  updateMainModel: (baseDir: string, model: string) => void;
  getProjectSettings: (baseDir: string) => Promise<ProjectSettings>;
  saveProjectSettings: (baseDir: string, settings: ProjectSettings) => Promise<void>;
  getFilePathSuggestions: (currentPath: string, directoriesOnly?: boolean) => Promise<string[]>;
  getAddableFiles: (baseDir: string) => Promise<string[]>;
  addFile: (baseDir: string, filePath: string, readOnly?: boolean) => void;
  isValidPath: (baseDir: string, path: string) => Promise<boolean>;
  isProjectPath: (path: string) => Promise<boolean>;
  dropFile: (baseDir: string, path: string) => void;
  runCommand: (baseDir: string, command: string) => void;
  scrapeWeb: (baseDir: string, url: string) => Promise<string>;
  getRecentProjects: () => Promise<string[]>;
  addRecentProject: (baseDir: string) => Promise<void>;
  removeRecentProject: (baseDir: string) => Promise<void>;
  interruptResponse: (baseDir: string) => void;
  applyEdits: (baseDir: string, edits: FileEdit[]) => void;

  addResponseChunkListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: ResponseChunkData) => void) => string;
  removeResponseChunkListener: (listenerId: string) => void;

  addResponseCompletedListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: ResponseCompletedData) => void) => string;
  removeResponseCompletedListener: (listenerId: string) => void;

  addLogListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: LogData) => void) => string;
  removeLogListener: (listenerId: string) => void;

  addContextFilesUpdatedListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: ContextFilesUpdatedData) => void) => string;
  removeContextFilesUpdatedListener: (listenerId: string) => void;

  addUpdateAutocompletionListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: AutocompletionData) => void) => string;
  removeUpdateAutocompletionListener: (listenerId: string) => void;

  addAskQuestionListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: QuestionData) => void) => string;
  removeAskQuestionListener: (listenerId: string) => void;

  addSetCurrentModelsListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: ModelsData & { baseDir: string }) => void) => string;
  removeSetCurrentModelsListener: (listenerId: string) => void;

  addCommandOutputListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: CommandOutputData) => void) => string;
  removeCommandOutputListener: (listenerId: string) => void;

  addTokensInfoListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: TokensInfoData) => void) => string;
  removeTokensInfoListener: (listenerId: string) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: ApplicationAPI;
  }
}
