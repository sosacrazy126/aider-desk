import { matchSorter } from 'match-sorter';
import { useEffect, useState } from 'react';
import { FaFile, FaFolder } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StyledTooltip } from '@/components/common/StyledTooltip';
import { AutocompletionInput } from '@/components/AutocompletionInput';
import { Checkbox } from '@/components/common/Checkbox';
import { IconButton } from '@/components/common/IconButton';

type Props = {
  baseDir: string;
  onClose: () => void;
  onAddFiles: (filePaths: string[], readOnly?: boolean) => void;
  initialReadOnly?: boolean;
};

export const AddFileDialog = ({ onClose, onAddFiles, baseDir, initialReadOnly = false }: Props) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isValidInputValue, setIsValidInputValue] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(initialReadOnly);

  const toggleReadOnly = () => {
    setIsReadOnly(!isReadOnly);
  };

  useEffect(() => {
    const updateSuggestions = async () => {
      if (!inputValue) {
        setSuggestions([]);
        return;
      }
      const suggestionFiles = isReadOnly ? await window.api.getFilePathSuggestions(inputValue) : await window.api.getAddableFiles(baseDir);

      if (showSuggestions) {
        const filteredSuggestions = matchSorter(
          suggestionFiles.filter((file) => !selectedPaths.includes(file)),
          inputValue,
          {
            keys: [
              (item) => item,
              (item) => item.split('/').pop()?.toLowerCase() ?? '',
              (item) =>
                item
                  .split(/[\\/]/)
                  .map((segment) => segment.replace(/_/g, ' '))
                  .join(' '),
            ],
          },
        );
        setSuggestions(filteredSuggestions);
      } else {
        setSuggestions([]);
      }
    };

    void updateSuggestions();
  }, [inputValue, showSuggestions, baseDir, isReadOnly, selectedPaths]);

  useEffect(() => {
    const checkValidPath = async () => {
      if (!inputValue) {
        setIsValidInputValue(false);
        return;
      }
      setIsValidInputValue(await window.api.isValidPath(baseDir, inputValue));
    };
    void checkValidPath();
  }, [inputValue, baseDir]);

  const handleAddPathFromInput = () => {
    if (inputValue && isValidInputValue && !selectedPaths.includes(inputValue)) {
      setSelectedPaths([...selectedPaths, inputValue]);
      setInputValue('');
      setShowSuggestions(false);
    } else if (!inputValue && selectedPaths.length > 0) {
      onAddFiles(selectedPaths, isReadOnly);
    }
  };

  const handleRemovePath = (pathToRemove: string) => {
    setSelectedPaths(selectedPaths.filter((path) => path !== pathToRemove));
  };

  const handleBrowse = async (browseType: 'file' | 'directory') => {
    try {
      const result = await window.api.dialog.showOpenDialog({
        properties: [browseType === 'file' ? 'openFile' : 'openDirectory', 'multiSelections'],
        defaultPath: initialReadOnly ? undefined : baseDir, // Consider if defaultPath makes sense for readOnly outside project
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const newPaths = result.filePaths
          .filter((p) => !selectedPaths.includes(p))
          .map((filePath) => (isReadOnly || !filePath.startsWith(baseDir) ? filePath : filePath.slice(baseDir.length + 1)));
        setSelectedPaths([...selectedPaths, ...newPaths]);
        setInputValue(''); // Clear input after browsing
        setShowSuggestions(false);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error selecting file(s)/directory(s):', error);
    }
  };

  const handleAddFiles = () => {
    if (selectedPaths.length > 0) {
      onAddFiles(selectedPaths, isReadOnly);
      // onClose will be called by ConfirmDialog's onConfirm
    }
  };

  return (
    <ConfirmDialog
      title={t('addFileDialog.title')}
      onCancel={onClose}
      onConfirm={handleAddFiles}
      confirmButtonText={t('common.add')}
      disabled={selectedPaths.length === 0}
      width={600}
      closeOnEscape
    >
      <StyledTooltip id="browseTooltipId" />
      <StyledTooltip id="removeFileTooltipId" />
      <AutocompletionInput
        value={inputValue}
        suggestions={suggestions}
        onChange={(value, isFromSuggestion) => {
          setShowSuggestions(!isFromSuggestion);
          if (isFromSuggestion) {
            setSelectedPaths((prev) => [...prev, value]);
            setInputValue('');
          } else {
            setInputValue(value);
          }
        }}
        placeholder={selectedPaths.length ? t('addFileDialog.placeholderFiles') : t('addFileDialog.placeholder')}
        autoFocus
        className="w-full p-3 pr-20 rounded-lg bg-neutral-900/50 border border-neutral-700/50 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500/50 focus:ring-1 focus:ring-neutral-500/50 transition-colors"
        rightElement={
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-1">
            <IconButton
              onClick={() => handleBrowse('file')}
              icon={<FaFile className="w-4 h-4" />}
              tooltipId="browseTooltipId"
              tooltip={t('addFileDialog.browseFile')}
              className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700/50 transition-colors"
            />
            <IconButton
              onClick={() => handleBrowse('directory')}
              icon={<FaFolder className="w-4 h-4" />}
              tooltipId="browseTooltipId"
              tooltip={t('addFileDialog.browseDirectory')}
              className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700/50 transition-colors"
            />
          </div>
        }
        onSubmit={handleAddPathFromInput}
      />
      {selectedPaths.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1 max-h-40 overflow-y-auto p-0.5 scrollbar-thin scrollbar-track-neutral-800 scrollbar-thumb-neutral-700 hover:scrollbar-thumb-neutral-600">
          {selectedPaths.map((path) => (
            <div key={path} className="flex items-center bg-neutral-700 text-white text-xs px-2 py-1 rounded-full">
              <span className="mr-1 truncate max-w-xs">{path}</span>
              <IconButton
                icon={<IoClose />}
                onClick={() => handleRemovePath(path)}
                tooltipId="removeFileTooltipId"
                tooltip={t('addFileDialog.removeFileTooltip')}
                className="p-0.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-600"
              />
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 ml-2">
        <Checkbox label={t('addFileDialog.readOnly')} checked={isReadOnly} onChange={toggleReadOnly} />
      </div>
    </ConfirmDialog>
  );
};
