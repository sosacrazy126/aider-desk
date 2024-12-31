import path from 'path';
import { app } from 'electron';
import { is } from '@electron-toolkit/utils';

export const AIDER_DESKTOP_DIR = `${app.getPath('userData')}${is.dev ? '-dev' : ''}`;
export const RESOURCES_DIR = is.dev ? path.join(__dirname, '../../resources') : process.resourcesPath;
export const LOGS_DIR = `${AIDER_DESKTOP_DIR}/logs`;
export const SETUP_COMPLETE_FILENAME = `${AIDER_DESKTOP_DIR}/setup-complete`;
export const PYTHON_VENV_DIR = `${AIDER_DESKTOP_DIR}/python-venv`;
export const PYTHON_COMMAND = `${PYTHON_VENV_DIR}/bin/python`;
export const AIDER_DESKTOP_CONNECTOR_DIR = `${AIDER_DESKTOP_DIR}/aider-connector`;
export const SOCKET_PORT = process.env.AIDER_DESKTOP_PORT ? parseInt(process.env.AIDER_DESKTOP_PORT) : 24337;
