import { ipcMain } from 'electron';
import { websocketManager } from './websocket';
import { projectManager } from './project-manager';

export const setupIpcHandlers = (): void => {
  ipcMain.on('send-prompt', (_, baseDir: string, prompt: string) => {
    websocketManager.sendPrompt(baseDir, prompt);
  });

  ipcMain.on('drop-file', (_, baseDir: string, filePath: string) => {
    websocketManager.dropFile(baseDir, filePath);
  });

  ipcMain.on('start-project', (_, baseDir: string) => {
    projectManager.startProject(baseDir);
  });

  ipcMain.on('stop-project', (_, baseDir: string) => {
    projectManager.stopProject(baseDir);
  });
};
