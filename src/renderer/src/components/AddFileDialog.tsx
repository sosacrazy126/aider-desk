import { useState, useEffect } from 'react';
import { FaFolder } from 'react-icons/fa';
import { matchSorter } from 'match-sorter';
import { ConfirmDialog } from './ConfirmDialog';
import { AutocompletionInput } from './AutocompletionInput';

interface Props {
  baseDir: string;
  onClose: () => void;
  onAddFile: (filePath: string) => void;
}

export const AddFileDialog = ({ onClose, onAddFile, baseDir }: Props) => {
  const [filePath, setFilePath] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isValidPath, setIsValidPath] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    const updateSuggestions = async () => {
      if (!filePath) {
        setSuggestions([]);
        setIsValidPath(false);
        return;
      }
      if (showSuggestions) {
        const addableFiles = await window.api.getAddableFiles(baseDir);
        const filteredSuggestions = matchSorter(addableFiles, filePath, {
          keys: [
            (item) => item,
            (item) => item.split('/').pop()?.toLowerCase() ?? '',
            (item) =>
              item
                .split(/[\\/]/)
                .map((segment) => segment.replace(/_/g, ' '))
                .join(' '),
          ],
        });
        setSuggestions(filteredSuggestions);
        setIsValidPath(addableFiles.includes(filePath));
      } else {
        setSuggestions([]);
        setIsValidPath(suggestions.includes(filePath));
      }
    };

    updateSuggestions();
  }, [filePath, showSuggestions, baseDir]);

  const handleBrowse = async () => {
    try {
      const result = await window.api.dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        defaultPath: baseDir,
      });

      if (!result.canceled && result.filePaths.length > 0) {
        setShowSuggestions(false);
        setFilePath(result.filePaths[0]);
        setIsValidPath(true);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
    }
  };

  const handleAddFile = () => {
    if (filePath && isValidPath) {
      onAddFile(filePath);
    }
  };

  return (
    <ConfirmDialog
      title="ADD FILE"
      onCancel={onClose}
      onConfirm={handleAddFile}
      confirmButtonText="Add"
      disabled={!filePath || !isValidPath}
      width={600}
      closeOnEscape
    >
      <AutocompletionInput
        value={filePath}
        suggestions={suggestions}
        onChange={(value, isFromSuggestion) => {
          setShowSuggestions(!isFromSuggestion);
          setFilePath(value);
        }}
        placeholder="Choose file to add"
        autoFocus
        className="w-full p-3 pr-12 rounded-lg bg-neutral-900/50 border border-neutral-700/50 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500/50 focus:ring-1 focus:ring-neutral-500/50 transition-colors"
        rightElement={
          <button
            onClick={handleBrowse}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700/50 transition-colors"
            title="Browse files"
          >
            <FaFolder className="w-4 h-4" />
          </button>
        }
        onSubmit={handleAddFile}
      />
    </ConfirmDialog>
  );
};
