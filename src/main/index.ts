import { join } from 'path';
import { app, shell, BrowserWindow } from 'electron';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';

import icon from '../../resources/icon.png?asset';
import { websocketManager } from './websocket';
import { setupIpcHandlers } from './ipcHandlers';
import { projectManager } from './project-manager';

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  websocketManager.initServer(mainWindow);
  projectManager.init(mainWindow);

  app.on('before-quit', () => {
    websocketManager.closeServer();
    projectManager.stopProjects();
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
};

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  const mainWindow = createWindow();
  setupIpcHandlers(mainWindow);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      const mainWindow = createWindow();
      setupIpcHandlers(mainWindow);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
