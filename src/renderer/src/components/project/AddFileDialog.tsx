import { matchSorter } from 'match-sorter';
import { useState, useEffect } from 'react';
import { FaFolder } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AutocompletionInput } from '@/components/AutocompletionInput';
import { Checkbox } from '@/components/common/Checkbox';

type Props = {
  baseDir: string;
  onClose: () => void;
  onAddFile: (filePath: string, readOnly?: boolean) => void;
  initialReadOnly?: boolean;
};

export const AddFileDialog = ({ onClose, onAddFile, baseDir, initialReadOnly = false }: Props) => {
  const { t } = useTranslation();
  const [filePath, setFilePath] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isValidPath, setIsValidPath] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(initialReadOnly);

  const convertPath = (path: string, toAbsolute: boolean) => {
    if (toAbsolute) {
      // If path is not absolute, prepend baseDir
      return path.startsWith('/') || path.includes(':') ? path : `${baseDir}/${path}`.replace(/\/+/g, '/');
    } else {
      // Convert absolute path to relative if it's under baseDir
      return path.startsWith(baseDir) ? path.slice(baseDir.length).replace(/^\//, '') : path;
    }
  };

  const toggleReadOnly = () => {
    const newReadOnlyState = !isReadOnly;
    if (filePath) {
      setFilePath(convertPath(filePath, newReadOnlyState));
    }
    setIsReadOnly(newReadOnlyState);
  };

  useEffect(() => {
    const updateSuggestions = async () => {
      if (!filePath) {
        setSuggestions([]);
        return;
      }
      const suggestFiles = isReadOnly ? await window.api.getFilePathSuggestions(filePath) : await window.api.getAddableFiles(baseDir);

      if (showSuggestions) {
        const filteredSuggestions = matchSorter(suggestFiles, filePath, {
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
      } else {
        setSuggestions([]);
      }
    };

    updateSuggestions();
  }, [filePath, showSuggestions, baseDir, isReadOnly]);

  useEffect(() => {
    const checkValidPath = async () => {
      setIsValidPath(await window.api.isValidPath(baseDir, filePath));
    };
    void checkValidPath();
  }, [filePath, baseDir]);

  const handleBrowse = async () => {
    try {
      const result = await window.api.dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        defaultPath: initialReadOnly ? undefined : baseDir,
      });

      if (!result.canceled && result.filePaths.length > 0) {
        setShowSuggestions(false);
        setFilePath(result.filePaths[0]);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
    }
  };

  const handleAddFile = () => {
    if (filePath && isValidPath) {
      onAddFile(filePath, isReadOnly);
    }
  };

  return (
    <ConfirmDialog
      title={t('addFileDialog.title')}
      onCancel={onClose}
      onConfirm={handleAddFile}
      confirmButtonText={t('common.add')}
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
        placeholder={t('addFileDialog.placeholder')}
        autoFocus
        className="w-full p-3 pr-12 rounded-lg bg-neutral-900/50 border border-neutral-700/50 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500/50 focus:ring-1 focus:ring-neutral-500/50 transition-colors"
        rightElement={
          <button
            onClick={handleBrowse}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700/50 transition-colors"
            title={t('addFileDialog.browse')}
          >
            <FaFolder className="w-4 h-4" />
          </button>
        }
        onSubmit={handleAddFile}
      />
      <div className="mt-3 ml-2">
        <Checkbox label={t('addFileDialog.readOnly')} checked={isReadOnly} onChange={toggleReadOnly} />
      </div>
    </ConfirmDialog>
  );
};
