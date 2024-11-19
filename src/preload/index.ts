import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import { v4 as uuidv4 } from 'uuid';
import { AutocompletionData, ConfirmAskData, FileAddedData, FileDroppedData, ResponseChunkData, ResponseCompletedData } from '../common/types';
import { ApplicationAPI } from './index.d';

const responseChunkListeners: Record<string, (event: Electron.IpcRendererEvent, ResponseChunkData) => void> = {};
const responseFinishedListeners: Record<string, (event: Electron.IpcRendererEvent, ResponseCompletedData) => void> = {};
const fileAddedListeners: Record<string, (event: Electron.IpcRendererEvent, FileAddedData) => void> = {};
const fileDroppedListeners: Record<string, (event: Electron.IpcRendererEvent, FileDroppedData) => void> = {};
const updateAutocompletionListeners: Record<string, (event: Electron.IpcRendererEvent, AutocompletionData) => void> = {};

const api: ApplicationAPI = {
  startProject: (baseDir: string) => ipcRenderer.send('start-project', baseDir),
  stopProject: (baseDir: string) => ipcRenderer.send('stop-project', baseDir),
  sendPrompt: (baseDir: string, prompt: string, editFormat?: string) => ipcRenderer.send('send-prompt', baseDir, prompt, editFormat),
  loadInputHistory: (baseDir: string) => ipcRenderer.invoke('load-input-history', baseDir),
  dialog: {
    showOpenDialog: (options: Electron.OpenDialogSyncOptions) => ipcRenderer.invoke('show-open-dialog', options),
  },
  loadProjects: () => ipcRenderer.invoke('load-projects'),
  saveProjects: (projects) => ipcRenderer.invoke('save-projects', projects),

  addResponseChunkListener: (baseDir, callback) => {
    const listenerId = uuidv4();
    responseChunkListeners[listenerId] = (event: Electron.IpcRendererEvent, data: ResponseChunkData) => {
      if (data.baseDir !== baseDir) {
        return;
      }
      callback(event, data);
    };
    ipcRenderer.on('response-chunk', responseChunkListeners[listenerId]);
    return listenerId;
  },
  removeResponseChunkListener: (listenerId) => {
    const callback = responseChunkListeners[listenerId];
    if (callback) {
      ipcRenderer.removeListener('response-chunk', callback);
      delete responseChunkListeners[listenerId];
    }
  },

  addResponseCompletedListener: (baseDir, callback) => {
    const listenerId = uuidv4();
    responseFinishedListeners[listenerId] = (event: Electron.IpcRendererEvent, data: ResponseCompletedData) => {
      if (data.baseDir !== baseDir) {
        return;
      }
      callback(event, data);
    };
    ipcRenderer.on('response-completed', responseFinishedListeners[listenerId]);
    return listenerId;
  },
  removeResponseCompletedListener: (listenerId) => {
    const callback = responseFinishedListeners[listenerId];
    if (callback) {
      ipcRenderer.removeListener('response-completed', callback);
      delete responseFinishedListeners[listenerId];
    }
  },

  addFileAddedListener: (baseDir, callback) => {
    const listenerId = uuidv4();
    fileAddedListeners[listenerId] = (event: Electron.IpcRendererEvent, data: FileAddedData) => {
      if (data.baseDir !== baseDir) {
        return;
      }
      callback(event, data);
    };
    ipcRenderer.on('file-added', fileAddedListeners[listenerId]);
    return listenerId;
  },
  removeFileAddedListener: (listenerId) => {
    const callback = fileAddedListeners[listenerId];
    if (callback) {
      ipcRenderer.removeListener('file-added', callback);
      delete fileAddedListeners[listenerId];
    }
  },

  addFileDroppedListener: (baseDir, callback) => {
    const listenerId = uuidv4();
    fileDroppedListeners[listenerId] = (event: Electron.IpcRendererEvent, data: FileDroppedData) => {
      if (data.baseDir !== baseDir) {
        return;
      }
      callback(event, data);
    };
    ipcRenderer.on('file-dropped', fileDroppedListeners[listenerId]);
    return listenerId;
  },
  removeFileDroppedListener: (listenerId) => {
    const callback = fileDroppedListeners[listenerId];
    if (callback) {
      ipcRenderer.removeListener('file-dropped', callback);
      delete fileDroppedListeners[listenerId];
    }
  },

  addUpdateAutocompletionListener: (baseDir, callback) => {
    const listenerId = uuidv4();
    updateAutocompletionListeners[listenerId] = (event: Electron.IpcRendererEvent, data: AutocompletionData) => {
      if (data.baseDir !== baseDir) {
        return;
      }
      callback(event, data);
    };
    ipcRenderer.on('update-autocompletion', updateAutocompletionListeners[listenerId]);
    return listenerId;
  },
  removeUpdateAutocompletionListener: (listenerId) => {
    const callback = updateAutocompletionListeners[listenerId];
    if (callback) {
      ipcRenderer.removeListener('update-autocompletion', callback);
      delete updateAutocompletionListeners[listenerId];
    }
  },

  addConfirmAskListener: (baseDir, callback) => {
    const listenerId = uuidv4();
    const listener = (event: Electron.IpcRendererEvent, data: ConfirmAskData) => {
      if (data.baseDir !== baseDir) {
        return;
      }
      callback(event, data);
    };
    ipcRenderer.on('confirm-ask', listener);
    return listenerId;
  },
  removeConfirmAskListener: (listenerId) => {
    const callback = responseChunkListeners[listenerId];
    if (callback) {
      ipcRenderer.removeListener('confirm-ask', callback);
      delete responseChunkListeners[listenerId];
    }
  },
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;
  window.api = api;
}
