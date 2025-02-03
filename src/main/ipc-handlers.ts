import { FileEdit, ProjectSettings, SettingsData } from '@common/types';
import { BrowserWindow, dialog, ipcMain } from 'electron';
import { getFilePathSuggestions, isProjectPath, isValidPath } from './file-system';
import { EditFormat } from './messages';
import { projectManager } from './project-manager';
import { Store } from './store';
import { scrapeWeb } from './web-scrapper';

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

  ipcMain.on('add-file', (_, baseDir: string, filePath: string, readOnly = false) => {
    projectManager.getProject(baseDir).addFile({ path: filePath, readOnly });
  });

  ipcMain.on('start-project', (_, baseDir: string) => {
    projectManager.startProject(baseDir);
  });

  ipcMain.on('stop-project', async (_, baseDir: string) => {
    await projectManager.stopProject(baseDir);
    store.addRecentProject(baseDir);
  });

  ipcMain.on('restart-project', async (_, baseDir: string) => {
    await projectManager.restartProject(baseDir);
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

  ipcMain.handle('get-recent-projects', async () => {
    return store.getRecentProjects();
  });

  ipcMain.handle('add-recent-project', async (_, baseDir: string) => {
    store.addRecentProject(baseDir);
  });

  ipcMain.handle('remove-recent-project', async (_, baseDir: string) => {
    store.removeRecentProject(baseDir);
  });

  ipcMain.handle('get-project-settings', (_, baseDir: string) => {
    return store.getProjectSettings(baseDir);
  });

  ipcMain.handle('save-project-settings', async (_, baseDir: string, settings: ProjectSettings) => {
    store.saveProjectSettings(baseDir, settings);
  });

  ipcMain.handle('get-addable-files', async (_, baseDir: string) => {
    return projectManager.getProject(baseDir).getAddableFiles();
  });

  ipcMain.handle('is-project-path', async (_, path: string) => {
    return isProjectPath(path);
  });

  ipcMain.handle('is-valid-path', async (_, baseDir: string, path: string) => {
    return isValidPath(baseDir, path);
  });

  ipcMain.handle('get-file-path-suggestions', async (_, currentPath: string, directoriesOnly = true) => {
    return getFilePathSuggestions(currentPath, directoriesOnly);
  });

  ipcMain.on('update-main-model', (_, baseDir: string, mainModel: string) => {
    const projectSettings = store.getProjectSettings(baseDir);
    const clearWeakModel = projectSettings.weakModel === projectSettings.mainModel;

    projectSettings.mainModel = mainModel;
    if (clearWeakModel) {
      projectSettings.weakModel = null;
    }

    store.saveProjectSettings(baseDir, projectSettings);
    projectManager.getProject(baseDir).updateModels(mainModel, projectSettings?.weakModel || null);
  });

  ipcMain.on('update-weak-model', (_, baseDir: string, weakModel: string) => {
    const projectSettings = store.getProjectSettings(baseDir);
    projectSettings.weakModel = weakModel;
    store.saveProjectSettings(baseDir, projectSettings);

    const project = projectManager.getProject(baseDir);
    project.updateModels(projectSettings.mainModel, weakModel);
  });

  ipcMain.on('update-architect-model', (_, baseDir: string, architectModel: string) => {
    const projectSettings = store.getProjectSettings(baseDir);
    projectSettings.architectModel = architectModel;
    store.saveProjectSettings(baseDir, projectSettings);

    const project = projectManager.getProject(baseDir);
    project.setArchitectModel(architectModel);
  });

  ipcMain.on('run-command', (_, baseDir: string, command: string) => {
    projectManager.getProject(baseDir).runCommand(command);
  });

  ipcMain.on('interrupt-response', (_, baseDir: string) => {
    projectManager.getProject(baseDir).interruptResponse();
  });

  ipcMain.on('apply-edits', (_, baseDir: string, edits: FileEdit[]) => {
    projectManager.getProject(baseDir).applyEdits(edits);
  });

  ipcMain.handle('scrape-web', async (_, baseDir: string, url: string) => {
    const content = await scrapeWeb(url);
    projectManager.getProject(baseDir).addMessage(content);
  });
};
