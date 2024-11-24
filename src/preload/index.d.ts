import {
  ResponseChunkData,
  ResponseCompletedData,
  FileAddedData,
  FileDroppedData,
  AutocompletionData,
  QuestionData,
  ProjectData,
  ProjectSettings,
  SettingsData,
  ResponseErrorData,
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
  getProjectSettings: (baseDir: string) => Promise<ProjectSettings>;
  saveProjectSettings: (baseDir: string, settings: ProjectSettings) => Promise<void>;

  addResponseChunkListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: ResponseChunkData) => void) => string;
  removeResponseChunkListener: (listenerId: string) => void;

  addResponseCompletedListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: ResponseCompletedData) => void) => string;
  removeResponseCompletedListener: (listenerId: string) => void;

  addResponseErrorListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: ResponseErrorData) => void) => string;
  removeResponseErrorListener: (listenerId: string) => void;

  addFileAddedListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: FileAddedData) => void) => string;
  removeFileAddedListener: (listenerId: string) => void;

  addFileDroppedListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: FileDroppedData) => void) => string;
  removeFileDroppedListener: (listenerId: string) => void;

  addUpdateAutocompletionListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: AutocompletionData) => void) => string;
  removeUpdateAutocompletionListener: (listenerId: string) => void;

  addAskQuestionListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: QuestionData) => void) => string;
  removeAskQuestionListener: (listenerId: string) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: ApplicationAPI;
  }
}
