import { electronAPI } from '@electron-toolkit/preload';
import { contextBridge, ipcRenderer } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import {
  AutocompletionData,
  FileAddedData,
  FileDroppedData,
  ModelsData,
  QuestionData,
  ResponseChunkData,
  ResponseCompletedData,
  ErrorData,
  SettingsData,
} from '../common/types';
import { ApplicationAPI } from './index.d';

export interface ResponseModelData extends ModelsData {
  baseDir: string;
}

const responseChunkListeners: Record<string, (event: Electron.IpcRendererEvent, data: ResponseChunkData) => void> = {};
const responseFinishedListeners: Record<string, (event: Electron.IpcRendererEvent, data: ResponseCompletedData) => void> = {};
const errorListeners: Record<string, (event: Electron.IpcRendererEvent, data: ErrorData) => void> = {};
const fileAddedListeners: Record<string, (event: Electron.IpcRendererEvent, data: FileAddedData) => void> = {};
const fileDroppedListeners: Record<string, (event: Electron.IpcRendererEvent, data: FileDroppedData) => void> = {};
const updateAutocompletionListeners: Record<string, (event: Electron.IpcRendererEvent, data: AutocompletionData) => void> = {};
const askQuestionListeners: Record<string, (event: Electron.IpcRendererEvent, data: QuestionData) => void> = {};
const setCurrentModelsListeners: Record<string, (event: Electron.IpcRendererEvent, data: ModelsData & { baseDir: string }) => void> = {};

const api: ApplicationAPI = {
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings: SettingsData) => ipcRenderer.invoke('save-settings', settings),
  startProject: (baseDir: string) => ipcRenderer.send('start-project', baseDir),
  stopProject: (baseDir: string) => ipcRenderer.send('stop-project', baseDir),
  sendPrompt: (baseDir: string, prompt: string, editFormat?: string) => ipcRenderer.send('send-prompt', baseDir, prompt, editFormat),
  answerQuestion: (baseDir: string, answer: string) => ipcRenderer.send('answer-question', baseDir, answer),
  loadInputHistory: (baseDir: string) => ipcRenderer.invoke('load-input-history', baseDir),
  dialog: {
    showOpenDialog: (options: Electron.OpenDialogSyncOptions) => ipcRenderer.invoke('show-open-dialog', options),
  },
  loadProjects: () => ipcRenderer.invoke('load-projects'),
  saveProjects: (projects) => ipcRenderer.invoke('save-projects', projects),
  updateMainModel: (baseDir, model) => ipcRenderer.send('update-main-model', baseDir, model),
  getProjectSettings: (baseDir) => ipcRenderer.invoke('get-project-settings', baseDir),
  saveProjectSettings: (baseDir, settings) => ipcRenderer.invoke('save-project-settings', baseDir, settings),
  getFilePathSuggestions: (currentPath: string) => ipcRenderer.invoke('get-file-path-suggestions', currentPath),
  getAddableFiles: (baseDir: string) => ipcRenderer.invoke('get-addable-files', baseDir),
  addFile: (baseDir: string, filePath: string) => ipcRenderer.send('add-file', baseDir, filePath),
  isProjectPath: (path: string) => ipcRenderer.invoke('isProjectPath', path),
  dropFile: (baseDir: string, path: string) => ipcRenderer.send('drop-file', baseDir, path),

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

  addErrorListener: (baseDir, callback) => {
    const listenerId = uuidv4();
    errorListeners[listenerId] = (event: Electron.IpcRendererEvent, data: ErrorData) => {
      if (data.baseDir !== baseDir) {
        return;
      }
      callback(event, data);
    };
    ipcRenderer.on('error', errorListeners[listenerId]);
    return listenerId;
  },
  removeErrorListener: (listenerId) => {
    if (errorListeners[listenerId]) {
      ipcRenderer.removeListener('error', errorListeners[listenerId]);
      delete errorListeners[listenerId];
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

  addAskQuestionListener: (baseDir, callback) => {
    const listenerId = uuidv4();
    askQuestionListeners[listenerId] = (event: Electron.IpcRendererEvent, data: QuestionData) => {
      if (data.baseDir !== baseDir) {
        return;
      }
      callback(event, data);
    };
    ipcRenderer.on('ask-question', askQuestionListeners[listenerId]);
    return listenerId;
  },
  removeAskQuestionListener: (listenerId) => {
    const callback = askQuestionListeners[listenerId];
    if (callback) {
      ipcRenderer.removeListener('ask-question', callback);
      delete askQuestionListeners[listenerId];
    }
  },

  addSetCurrentModelsListener: (baseDir, callback) => {
    const listenerId = uuidv4();
    setCurrentModelsListeners[listenerId] = (event: Electron.IpcRendererEvent, data: ModelsData & { baseDir: string }) => {
      if (data.baseDir !== baseDir) {
        return;
      }
      callback(event, data);
    };
    ipcRenderer.on('set-current-models', setCurrentModelsListeners[listenerId]);
    return listenerId;
  },
  removeSetCurrentModelsListener: (listenerId) => {
    const callback = setCurrentModelsListeners[listenerId];
    if (callback) {
      ipcRenderer.removeListener('set-current-models', callback);
      delete setCurrentModelsListeners[listenerId];
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
