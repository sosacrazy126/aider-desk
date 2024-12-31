import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { delay } from '@common/utils';
import { AIDER_DESKTOP_DIR, SETUP_COMPLETE_FILENAME, PYTHON_VENV_DIR, AIDER_DESKTOP_CONNECTOR_DIR, RESOURCES_DIR } from './constants';

const isPythonInstalled = (): boolean => {
  try {
    const command = process.platform === 'win32' ? 'python --version' : 'python3 --version';
    execSync(command);
    return true;
  } catch {
    return false;
  }
};

const createVirtualEnv = (): void => {
  const command = process.platform === 'win32' ? 'python' : 'python3';
  execSync(`${command} -m venv "${PYTHON_VENV_DIR}"`, { stdio: 'inherit' });
};

const getPythonVenvBinPath = (): string => {
  return process.platform === 'win32' ? path.join(PYTHON_VENV_DIR, 'Scripts') : path.join(PYTHON_VENV_DIR, 'bin');
};

const setupAiderConnector = () => {
  if (!fs.existsSync(AIDER_DESKTOP_CONNECTOR_DIR)) {
    fs.mkdirSync(AIDER_DESKTOP_CONNECTOR_DIR, { recursive: true });
  }

  // Copy connector.py from resources
  const sourceConnectorPath = path.join(RESOURCES_DIR, 'connector/connector.py');
  const destConnectorPath = path.join(AIDER_DESKTOP_CONNECTOR_DIR, 'connector.py');
  fs.copyFileSync(sourceConnectorPath, destConnectorPath);

  installAiderConnectorRequirements();
};

const installAiderConnectorRequirements = (): void => {
  const pythonBinPath = getPythonVenvBinPath();
  const pip = process.platform === 'win32' ? 'pip.exe' : 'pip';
  const pipPath = path.join(pythonBinPath, pip);

  const packages = ['aider-chat --upgrade', 'python-socketio', 'websocket-client', 'nest-asyncio'];

  for (const pkg of packages) {
    execSync(`"${pipPath}" install ${pkg}`, {
      stdio: 'inherit',
      env: {
        ...process.env,
        VIRTUAL_ENV: PYTHON_VENV_DIR,
        PATH: `${pythonBinPath}${path.delimiter}${process.env.PATH}`,
      },
    });
  }
};

const performUpdateCheck = async (updateProgress: UpdateProgressFunction): Promise<void> => {
  updateProgress({
    step: 'Update Check',
    message: 'Updating Aider connector...',
  });

  setupAiderConnector();
};

export type UpdateProgressData = {
  step: string;
  message: string;
};

export type UpdateProgressFunction = (data: UpdateProgressData) => void;

export const performStartUp = async (updateProgress: UpdateProgressFunction): Promise<boolean> => {
  if (fs.existsSync(SETUP_COMPLETE_FILENAME)) {
    await performUpdateCheck(updateProgress);
    return true;
  }

  updateProgress({
    step: 'AiderDesk Setup',
    message: 'Performing initial setup...',
  });

  await delay(2000);

  if (!fs.existsSync(AIDER_DESKTOP_DIR)) {
    fs.mkdirSync(AIDER_DESKTOP_DIR, { recursive: true });
  }

  try {
    updateProgress({
      step: 'Checking Python Installation',
      message: 'Verifying Python installation...',
    });

    // Check Python installation
    if (!isPythonInstalled()) {
      throw new Error('Python is not installed. Please install Python 3.x before running the application.');
    }

    updateProgress({
      step: 'Creating Virtual Environment',
      message: 'Setting up Python virtual environment...',
    });

    // Create virtual environment
    createVirtualEnv();

    updateProgress({
      step: 'Setting Up Connector',
      message: 'Installing Aider connector...',
    });

    setupAiderConnector();

    updateProgress({
      step: 'Finishing Setup',
      message: 'Completing installation...',
    });

    // Create setup complete file
    fs.writeFileSync(SETUP_COMPLETE_FILENAME, new Date().toISOString());

    return true;
  } catch (error) {
    // Clean up if setup fails
    if (fs.existsSync(PYTHON_VENV_DIR)) {
      fs.rmSync(PYTHON_VENV_DIR, { recursive: true, force: true });
    }
    if (fs.existsSync(SETUP_COMPLETE_FILENAME)) {
      fs.unlinkSync(SETUP_COMPLETE_FILENAME);
    }
    throw error;
  }
};
