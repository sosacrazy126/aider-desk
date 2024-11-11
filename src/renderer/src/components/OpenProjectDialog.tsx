import { useState } from 'react';

type Props = {
  onClose: () => void;
  onAddProject: (baseDir: string) => void;
};

export const OpenProjectDialog = ({ onClose, onAddProject }: Props) => {
  const [projectPath, setProjectPath] = useState('');

  const handleSelectProject = async () => {
    try {
      const result = await window.electron.dialog.showOpenDialog({
        properties: ['openDirectory'],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        setProjectPath(result.filePaths[0]);
      }
    } catch (error) {
      console.error('Error selecting project:', error);
    }
  };

  const handleAddProject = () => {
    if (projectPath) {
      onAddProject(projectPath);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-neutral-800 p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl mb-4 text-neutral-100">Open Project</h2>
        <div className="mb-4">
          <input
            type="text"
            value={projectPath}
            placeholder="Select project directory"
            className="w-full p-2 bg-neutral-700 text-neutral-100 rounded"
            readOnly
          />
          <button onClick={handleSelectProject} className="mt-2 w-full bg-neutral-600 text-neutral-100 p-2 rounded hover:bg-neutral-500">
            Browse
          </button>
        </div>
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="bg-neutral-600 text-neutral-100 px-4 py-2 rounded hover:bg-neutral-500">
            Cancel
          </button>
          <button
            onClick={handleAddProject}
            disabled={!projectPath}
            className={`px-4 py-2 rounded ${projectPath ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-neutral-500 text-neutral-300 cursor-not-allowed'}`}
          >
            Add Project
          </button>
        </div>
      </div>
    </div>
  );
};
