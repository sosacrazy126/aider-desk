import { join } from 'path';

import { delay } from '@common/utils';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { app, shell, BrowserWindow, dialog } from 'electron';
import ProgressBar from 'electron-progressbar';
import { McpClient } from 'src/main/mcp-client';

import icon from '../../resources/icon.png?asset';

import { setupAutoUpdater, checkForUpdates } from './auto-updater';
import { connectorManager } from './connector-manager';
import { setupIpcHandlers } from './ipc-handlers';
import { projectManager } from './project-manager';
import { performStartUp, UpdateProgressData } from './start-up';
import { Store } from './store';

const initStore = async (): Promise<Store> => {
  const store = new Store();
  await store.init();
  return store;
};

const initWindow = (store: Store) => {
  const lastWindowState = store.getWindowState();
  const mainWindow = new BrowserWindow({
    width: lastWindowState.width,
    height: lastWindowState.height,
    x: lastWindowState.x,
    y: lastWindowState.y,
    show: false,
    autoHideMenuBar: true,
    icon,
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

  const saveWindowState = (): void => {
    const [width, height] = mainWindow.getSize();
    const [x, y] = mainWindow.getPosition();
    store.setWindowState({ width, height, x, y, isMaximized: mainWindow.isMaximized() });
  };

  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);
  mainWindow.on('maximize', saveWindowState);
  mainWindow.on('unmaximize', saveWindowState);

  const mcpClient = new McpClient(store);
  void mcpClient.init();

  connectorManager.init(mainWindow);
  projectManager.init(mainWindow, store, mcpClient);
  setupIpcHandlers(mainWindow, store, mcpClient);

  app.on('before-quit', async () => {
    connectorManager.close();
    await projectManager.close();
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
};

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.hotovo.aider-desk');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  if (!is.dev) {
    setupAutoUpdater();
    await checkForUpdates();
  }

  const progressBar = new ProgressBar({
    text: 'Starting AiderDesk...',
    detail: 'Initializing...',
    closeOnComplete: false,
    indeterminate: true,
    style: {
      text: {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#f1f3f5',
      },
      detail: {
        fontSize: '12px',
        color: '#adb5bd',
      },
      bar: {
        height: '16px',
        borderRadius: '4px',
        backgroundColor: '#1c2025',
      },
      value: {
        backgroundColor: '#1c2025',
        borderRadius: '4px',
      },
    },
    browserWindow: {
      width: 400,
      icon,
      backgroundColor: '#1c2025',
      webPreferences: {
        nodeIntegration: true,
      },
    },
  });

  await new Promise((resolve) => {
    progressBar.on('ready', () => {
      resolve(null);
    });
  });
  await delay(1000);

  const updateProgress = ({ step, message }: UpdateProgressData) => {
    progressBar.detail = message;
    progressBar.text = step;
  };

  try {
    await performStartUp(updateProgress);
    updateProgress({
      step: 'Startup complete',
      message: 'Everything is ready! Have fun coding!',
    });
    progressBar.setCompleted();
    await delay(1000);
  } catch (error) {
    progressBar.close();
    dialog.showErrorBox('Setup Failed', error instanceof Error ? error.message : 'Unknown error occurred during setup');
    app.quit();
    return;
  }

  const store = await initStore();
  initWindow(store);

  progressBar.close();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      initWindow(store);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle CTRL+C (SIGINT)
process.on('SIGINT', async () => {
  connectorManager.close();
  await projectManager.close();
  process.exit(0);
});

process.on('exit', () => {
  app.quit();
});
