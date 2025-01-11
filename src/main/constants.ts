import path from 'path';
import { app } from 'electron';
import { is } from '@electron-toolkit/utils';

if (is.dev) {
  app.setPath('userData', `${app.getPath('userData')}-dev`);
}

export const AIDER_DESKTOP_DIR = app.getPath('userData');
export const RESOURCES_DIR = is.dev ? path.join(__dirname, '..', '..', 'resources') : process.resourcesPath;
export const LOGS_DIR = path.join(AIDER_DESKTOP_DIR, 'logs');
export const SETUP_COMPLETE_FILENAME = path.join(AIDER_DESKTOP_DIR, 'setup-complete');
export const PYTHON_VENV_DIR = path.join(AIDER_DESKTOP_DIR, 'python-venv');
export const PYTHON_COMMAND = process.platform === 'win32' ? path.join(PYTHON_VENV_DIR, 'Scripts', 'pythonw.exe') : path.join(PYTHON_VENV_DIR, 'bin', 'python');
export const AIDER_DESKTOP_CONNECTOR_DIR = path.join(AIDER_DESKTOP_DIR, 'aider-connector');
export const SOCKET_PORT = process.env.AIDER_DESKTOP_PORT ? parseInt(process.env.AIDER_DESKTOP_PORT) : 24337;
