import { ipcMain, dialog, BrowserWindow } from 'electron';
import { EditFormat } from './messages';
import { connectorManager } from './connector-manager';
import { projectManager } from './project-manager';
import { Store } from './store';

export const setupIpcHandlers = (mainWindow: BrowserWindow, store: Store) => {
  ipcMain.on('send-prompt', (_, baseDir: string, prompt: string, editFormat?: EditFormat) => {
    connectorManager.sendPrompt(baseDir, prompt, editFormat);
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

  ipcMain.handle('load-input-history', async (_, baseDir: string) => {
    return await projectManager.getProject(baseDir).loadInputHistory();
  });

  ipcMain.handle('load-projects', async () => {
    return store.getOpenProjects();
  });

  ipcMain.handle('save-projects', async (_, projects) => {
    store.setOpenProjects(projects);
  });
};
