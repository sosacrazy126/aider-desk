import { dialog, MessageBoxOptions } from 'electron';
import { autoUpdater, UpdateDownloadedEvent } from 'electron-updater';

import logger from './logger';

export const setupAutoUpdater = (): void => {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    logger.info('Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    logger.info('Update available', { version: info.version });
  });

  autoUpdater.on('update-not-available', () => {
    logger.info('No updates available');
  });

  autoUpdater.on('download-progress', (progressObj) => {
    logger.info('Update download progress', {
      percent: progressObj.percent,
      transferred: progressObj.transferred,
      total: progressObj.total,
      bytesPerSecond: progressObj.bytesPerSecond,
    });
  });

  autoUpdater.on('update-downloaded', (event: UpdateDownloadedEvent) => {
    const dialogOpts: MessageBoxOptions = {
      type: 'info',
      buttons: ['Restart', 'Later'],
      title: 'Application Update',
      message: process.platform === 'win32' ? event.releaseNotes?.toString() || '' : event.releaseName || '',
      detail: 'A new version has been downloaded. Restart the application to apply the updates.',
    };

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (error) => {
    logger.error('There was a problem updating the application', {
      error: error.message,
    });
    dialog.showErrorBox('Update Error', 'There was a problem updating the application: ' + error.message);
  });
};

export const checkForUpdates = async (): Promise<void> => {
  await autoUpdater.checkForUpdatesAndNotify();
};
