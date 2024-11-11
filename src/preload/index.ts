import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import { v4 as uuidv4 } from 'uuid';
import { FileAddedData, FileDroppedData, ResponseChunkData, ResponseCompletedData } from '../common/types';
import { ApplicationAPI } from './index.d';

const responseChunkListeners: Record<string, (event: Electron.IpcRendererEvent, data: ResponseChunkData) => void> = {};
const responseFinishedListeners: Record<string, (event: Electron.IpcRendererEvent, data: ResponseCompletedData) => void> = {};
const fileAddedListeners: Record<string, (event: Electron.IpcRendererEvent, data: FileAddedData) => void> = {};
const fileDroppedListeners: Record<string, (event: Electron.IpcRendererEvent, data: FileDroppedData) => void> = {};

const api: ApplicationAPI = {
  startProject: (baseDir: string) => ipcRenderer.send('start-project', baseDir),
  stopProject: (baseDir: string) => ipcRenderer.send('stop-project', baseDir),
  sendPrompt: (baseDir: string, prompt: string) => ipcRenderer.send('send-prompt', baseDir, prompt),

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
