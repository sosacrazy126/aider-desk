import {
  AutocompletionData,
  ModelsData,
  ProjectData,
  ProjectSettings,
  QuestionData,
  ResponseChunkData,
  ResponseCompletedData,
  ErrorData,
  SettingsData,
  ContextFilesUpdatedData,
} from '../common/types';
import type { ElectronAPI } from '@electron-toolkit/preload';

export interface ApplicationAPI {
  loadSettings: () => Promise<SettingsData>;
  saveSettings: (settings: SettingsData) => Promise<void>;
  startProject: (baseDir: string) => void;
  stopProject: (baseDir: string) => void;
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

  addResponseChunkListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: ResponseChunkData) => void) => string;
  removeResponseChunkListener: (listenerId: string) => void;

  addResponseCompletedListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: ResponseCompletedData) => void) => string;
  removeResponseCompletedListener: (listenerId: string) => void;

  addErrorListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: ErrorData) => void) => string;
  removeErrorListener: (listenerId: string) => void;

  addContextFilesUpdatedListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: ContextFilesUpdatedData) => void) => string;
  removeContextFilesUpdatedListener: (listenerId: string) => void;

  addUpdateAutocompletionListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: AutocompletionData) => void) => string;
  removeUpdateAutocompletionListener: (listenerId: string) => void;

  addAskQuestionListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: QuestionData) => void) => string;
  removeAskQuestionListener: (listenerId: string) => void;

  addSetCurrentModelsListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: ModelsData & { baseDir: string }) => void) => string;
  removeSetCurrentModelsListener: (listenerId: string) => void;

  addWarningListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: { baseDir: string; warning: string }) => void) => string;
  removeWarningListener: (listenerId: string) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: ApplicationAPI;
  }
}
