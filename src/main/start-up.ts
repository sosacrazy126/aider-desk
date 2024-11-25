import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { delay } from '@common/utils';
import { AIDER_DESKTOP_DIR, SETUP_COMPLETE_FILENAME, PYTHON_VENV_DIR, AIDER_DESKTOP_CONNECTOR_REPOSITORY, AIDER_DESKTOP_CONNECTOR_BRANCH } from './constants';

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

const cloneRepository = (): string => {
  const repoDir = path.join(AIDER_DESKTOP_DIR, 'aider');
  if (!fs.existsSync(repoDir)) {
    execSync(`git clone ${AIDER_DESKTOP_CONNECTOR_REPOSITORY} "${repoDir}"`, { stdio: 'inherit' });
  }
  execSync(`git -C "${repoDir}" checkout ${AIDER_DESKTOP_CONNECTOR_BRANCH}`, { stdio: 'inherit' });
  return repoDir;
};

const installRequirements = (repoDir: string): void => {
  const pythonBinPath = getPythonVenvBinPath();
  const pip = process.platform === 'win32' ? 'pip.exe' : 'pip';
  const pipPath = path.join(pythonBinPath, pip);

  execSync(`"${pipPath}" install -r "${path.join(repoDir, 'requirements.txt')}"`, {
    stdio: 'inherit',
    env: {
      ...process.env,
      VIRTUAL_ENV: PYTHON_VENV_DIR,
      PATH: `${pythonBinPath}${path.delimiter}${process.env.PATH}`,
    },
  });
};

const performUpdateCheck = async (updateProgress: UpdateProgressFunction): Promise<void> => {
  const repoDir = path.join(AIDER_DESKTOP_DIR, 'aider');

  updateProgress({
    step: 'Update Check',
    message: 'Checking for updates...',
  });

  // Fetch latest changes
  execSync(`git -C "${repoDir}" fetch`, { stdio: 'inherit' });

  // Check if there are any changes
  const localCommit = execSync(`git -C "${repoDir}" rev-parse HEAD`).toString().trim();
  const remoteCommit = execSync(`git -C "${repoDir}" rev-parse origin/${AIDER_DESKTOP_CONNECTOR_BRANCH}`).toString().trim();

  if (localCommit !== remoteCommit) {
    updateProgress({
      step: 'Update Check',
      message: 'Updating to latest version...',
    });

    // Checkout latest changes
    execSync(`git -C "${repoDir}" checkout ${AIDER_DESKTOP_CONNECTOR_BRANCH}`, { stdio: 'inherit' });
    execSync(`git -C "${repoDir}" pull origin ${AIDER_DESKTOP_CONNECTOR_BRANCH}`, { stdio: 'inherit' });

    // Reinstall requirements in case they changed
    installRequirements(repoDir);
  }
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
    step: 'Aider Desktop Setup',
    message: 'Performing initial setup...',
  });

  await delay(2000);

  // Create AIDER_DESKTOP_DIR if it doesn't exist
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

    updateProgress?.({
      step: 'Cloning Repository',
      message: 'Cloning Aider Desktop Connector repository...',
    });

    // Clone repository and switch to the correct branch
    const repoDir = cloneRepository();

    updateProgress({
      step: 'Installing Dependencies',
      message: 'Installing Python dependencies...',
    });

    // Install requirements
    installRequirements(repoDir);

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
