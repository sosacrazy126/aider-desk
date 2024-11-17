import { ipcMain, dialog, BrowserWindow } from 'electron';
import { EditFormat } from './messages';
import { websocketManager } from './websocket';
import { projectManager } from './project-manager';

export const setupIpcHandlers = (mainWindow: BrowserWindow) => {
  ipcMain.on('send-prompt', (_, baseDir: string, prompt: string, editFormat?: EditFormat) => {
    websocketManager.sendPrompt(baseDir, prompt, editFormat);
  });

  ipcMain.on('drop-file', (_, baseDir: string, filePath: string) => {
    projectManager.getProject(baseDir).dropFile(filePath);
  });

  ipcMain.on('start-project', (_, baseDir: string) => {
    projectManager.startProject(baseDir);
  });

  ipcMain.on('stop-project', (_, baseDir: string) => {
    projectManager.stopProject(baseDir);
  });

  ipcMain.handle('show-open-dialog', async (_, options: Electron.OpenDialogSyncOptions) => {
    return await dialog.showOpenDialog(mainWindow, options);
  });
};
