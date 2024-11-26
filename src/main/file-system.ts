import * as fs from 'fs';
import * as path from 'path';
import logger from './logger';

export const getPathAutocompletion = async (currentPath: string): Promise<string[]> => {
  try {
    let dirPath = currentPath;
    let searchPattern = '';

    // If path ends with a non-separator, treat the last part as a search pattern
    if (currentPath && !currentPath.endsWith(path.sep)) {
      dirPath = path.dirname(currentPath);
      searchPattern = path.basename(currentPath).toLowerCase();
    }

    // Ensure directory exists
    if (!fs.existsSync(dirPath)) {
      dirPath = path.dirname(dirPath);
    }

    // Read directory contents
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

    // Filter and sort entries
    return entries
      .filter((entry) => entry.isDirectory() && (!searchPattern || entry.name.toLowerCase().startsWith(searchPattern)))
      .map((entry) => path.join(dirPath, entry.name))
      .filter((entryPath) => entryPath !== currentPath)
      .sort();
  } catch (error) {
    logger.error('Error getting path autocompletion:', { error });
    return [];
  }
};

export const isProjectPath = async (path: string): Promise<boolean> => {
  try {
    return fs.existsSync(path);
  } catch (error) {
    logger.error('Error checking if path exists:', { error });
    return false;
  }
};
