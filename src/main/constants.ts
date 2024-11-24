import { app } from 'electron';

export const AIDER_DESKTOP_DIR = app.getPath('userData');
export const LOGS_DIR = `${AIDER_DESKTOP_DIR}/logs`;
export const SETUP_COMPLETE_FILENAME = `${AIDER_DESKTOP_DIR}/setup-complete`;
export const PYTHON_VENV_DIR = `${AIDER_DESKTOP_DIR}/python-venv`;
export const PYTHON_COMMAND = `${PYTHON_VENV_DIR}/bin/python`;
export const AIDER_DESKTOP_CONNECTOR_DIR = `${AIDER_DESKTOP_DIR}/aider`;
export const AIDER_DESKTOP_CONNECTOR_REPOSITORY = 'https://github.com/wladimiiir/aider.git';
export const AIDER_DESKTOP_CONNECTOR_BRANCH = 'aider-desktop-connector';
export const SOCKET_PORT = process.env.AIDER_DESKTOP_PORT ? parseInt(process.env.AIDER_DESKTOP_PORT) : 24337;
