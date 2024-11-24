import { BrowserWindow, dialog, ipcMain } from 'electron';
import { ProjectSettings, SettingsData } from '@common/types';
import { EditFormat } from './messages';
import { projectManager } from './project-manager';
import { Store } from './store';

export const setupIpcHandlers = (mainWindow: BrowserWindow, store: Store) => {
  ipcMain.handle('load-settings', () => {
    return store.getSettings();
  });

  ipcMain.handle('save-settings', (_, settings: SettingsData) => {
    store.saveSettings(settings);
  });

  ipcMain.on('send-prompt', (_, baseDir: string, prompt: string, editFormat?: EditFormat) => {
    projectManager.getProject(baseDir).sendPrompt(prompt, editFormat);
  });

  ipcMain.on('answer-question', (_, baseDir: string, answer: string) => {
    projectManager.getProject(baseDir).answerQuestion(answer);
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

  ipcMain.handle('get-project-settings', (_, baseDir: string) => {
    return store.getProjectSettings(baseDir);
  });

  ipcMain.handle('save-project-settings', (_, baseDir: string, settings: ProjectSettings) => {
    store.saveProjectSettings(baseDir, settings);
  });
};
