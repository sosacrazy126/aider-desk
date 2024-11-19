import { ResponseChunkData, ResponseCompletedData, FileAddedData, FileDroppedData, AutocompletionData, ConfirmAskData } from '../common/types';
import type { ElectronAPI } from '@electron-toolkit/preload';

export interface ApplicationAPI {
  startProject: (baseDir: string) => void;
  stopProject: (baseDir: string) => void;
  sendPrompt: (baseDir: string, prompt: string, editFormat?: string) => void;
  loadInputHistory: (baseDir: string) => Promise<string[]>;
  dialog: {
    showOpenDialog: (options: Electron.OpenDialogSyncOptions) => Promise<Electron.OpenDialogReturnValue>;
  };
  loadProjects: () => Promise<string[]>;
  saveProjects: (projects: string[]) => Promise<void>;

  addResponseChunkListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent,  ResponseChunkData) => void) => string;
  removeResponseChunkListener: (listenerId: string) => void;

  addResponseCompletedListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent,  ResponseCompletedData) => void) => string;
  removeResponseCompletedListener: (listenerId: string) => void;

  addFileAddedListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent,  FileAddedData) => void) => string;
  removeFileAddedListener: (listenerId: string) => void;

  addFileDroppedListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent,  FileDroppedData) => void) => string;
  removeFileDroppedListener: (listenerId: string) => void;

  addUpdateAutocompletionListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent,  AutocompletionData) => void) => string;
  removeUpdateAutocompletionListener: (listenerId: string) => void;

  addConfirmAskListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent,  ConfirmAskData) => void) => string;
  removeConfirmAskListener: (listenerId: string) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: ApplicationAPI;
  }
}
