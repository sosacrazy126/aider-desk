import type { ElectronAPI } from '@electron-toolkit/preload';
import { ResponseChunkData, ResponseCompletedData, FileAddedData, FileDroppedData } from '../common/types';

export interface ApplicationAPI {
  startProject: (baseDir: string) => void;
  stopProject: (baseDir: string) => void;
  sendPrompt: (baseDir: string, prompt: string) => void;
  dialog: {
    showOpenDialog: (options: Electron.OpenDialogSyncOptions) => Promise<Electron.OpenDialogReturnValue>;
  };

  addResponseChunkListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: ResponseChunkData) => void) => string;
  removeResponseChunkListener: (listenerId: string) => void;

  addResponseCompletedListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: ResponseCompletedData) => void) => string;
  removeResponseCompletedListener: (listenerId: string) => void;

  addFileAddedListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: FileAddedData) => void) => string;
  removeFileAddedListener: (listenerId: string) => void;

  addFileDroppedListener: (baseDir: string, callback: (event: Electron.IpcRendererEvent, data: FileDroppedData) => void) => string;
  removeFileDroppedListener: (listenerId: string) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: ApplicationAPI;
  }
}

