import { QuestionData } from '@common/types';
import { useClickOutside } from 'hooks/useClickOutside';
import { useSettings } from 'hooks/useSettings';
import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { BiSend } from 'react-icons/bi';
import { CgLock, CgLockUnlock } from 'react-icons/cg';
import { MdKeyboardArrowUp, MdStop } from 'react-icons/md';
import { ModelSelector, ModelSelectorRef } from './ModelSelector';

const PLACEHOLDERS = [
  'How can I help you today?',
  'What task can I assist you with?',
  'What would you like me to code?',
  'Let me help you solve a problem',
  'Can I help you with an improvement?',
  'Wanna refactor some code?',
  'Can I help you optimize some algorithm?',
  'Let me help you design a new feature',
  'Can I help you debug an issue?',
  'Let me help you create a test suite',
  'Let me help you implement a design pattern',
  'Can I explain some code to you?',
  'Let me help you modernize some legacy code',
  'Can I help you write documentation?',
  'Let me help you improve performance',
  'Give me some task!',
];

const COMMANDS = ['/code', '/ask', '/architect', '/add', '/model', '/read-only'];
const CONFIRM_COMMANDS = ['/clear', '/web'];

const EDIT_FORMATS = [
  { value: 'code', label: 'Code' },
  { value: 'ask', label: 'Ask' },
  { value: 'architect', label: 'Architect' },
];

const ANSWERS = ['y', 'n', 'a', 'd'];

export interface PromptFieldRef {
  focus: () => void;
}

type Props = {
  baseDir: string;
  processing: boolean;
  isActive: boolean;
  words?: string[];
  models?: string[];
  currentModel?: string;
  defaultEditFormat?: string;
  onSubmitted: (prompt: string, editFormat?: string, images?: string[]) => void;
  showFileDialog: (readOnly: boolean) => void;
  clearMessages: () => void;
  scrapeWeb: (url: string) => void;
  question?: QuestionData | null;
  answerQuestion?: (answer: string) => void;
  interruptResponse: () => void;
};

export const PromptField = React.forwardRef<PromptFieldRef, Props>(
  (
    {
      baseDir,
      processing = false,
      isActive = false,
      words = [],
      models = [],
      currentModel,
      defaultEditFormat = 'code',
      showFileDialog,
      onSubmitted,
      clearMessages,
      scrapeWeb,
      question,
      answerQuestion,
      interruptResponse,
    }: Props,
    ref,
  ) => {
    const [text, setText] = useState('');
    const [editFormat, setEditFormat] = useState<string | undefined>(defaultEditFormat);
    const [suggestionsVisible, setSuggestionsVisible] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
    const [placeholder] = useState(PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);
    const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(-1);
    const [inputHistory, setInputHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showFormatSelector, setShowFormatSelector] = useState(false);
    const [editFormatLocked, setEditFormatLocked] = useState(false);
    const { settings, setSettings, saveSettings } = useSettings();
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const modelSelectorRef = useRef<ModelSelectorRef>(null);
    const formatSelectorRef = useRef<HTMLDivElement>(null);

    useClickOutside(formatSelectorRef, () => setShowFormatSelector(false));

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    const loadHistory = async () => {
      try {
        const history = await window.api.loadInputHistory(baseDir);
        setInputHistory(history || []);
      } catch (error: unknown) {
        console.error('Failed to load input history:', error);
        // If loading fails, continue with empty history
        setInputHistory([]);
      }
    };

    const invokeCommand = useCallback(
      (command: string): void => {
        switch (command) {
          case '/code':
          case '/ask':
          case '/architect': {
            const prompt = text.replace(command, '').trim();
            setText(prompt);
            setEditFormat(command.slice(1));
            setEditFormatLocked(false);
            break;
          }
          case '/add':
            setText('');
            showFileDialog(false);
            break;
          case '/read-only':
            setText('');
            showFileDialog(true);
            break;
          case '/model':
            setText('');
            modelSelectorRef.current?.open();
            break;
          case '/web': {
            const url = text.replace('/web', '').trim();
            setText('');
            scrapeWeb(url);
            break;
          }
          case '/clear':
            setText('');
            clearMessages();
            break;
        }
      },
      [showFileDialog, text, scrapeWeb],
    );

    useEffect(() => {
      if (question) {
        setSelectedAnswer(question.defaultAnswer || 'y');
      }
    }, [question]);

    useEffect(() => {
      if (processing) {
        return;
      }
      void loadHistory();
    }, [processing, baseDir]);

    useEffect(() => {
      if (isActive && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isActive]);

    useEffect(() => {
      if (isActive && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isActive]);

    useEffect(() => {
      if (isActive && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isActive]);

    useEffect(() => {
      const commandMatch = COMMANDS.find((cmd) => text.startsWith(cmd));
      if (commandMatch) {
        invokeCommand(commandMatch);
        setSuggestionsVisible(false);
      }
    }, [text, invokeCommand]);

    const getCurrentWord = (text: string, cursorPosition: number) => {
      const textBeforeCursor = text.slice(0, cursorPosition);
      const words = textBeforeCursor.split(/\s/);
      return words[words.length - 1] || '';
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      setText(newText);

      const word = getCurrentWord(newText, e.target.selectionStart);
      setHighlightedSuggestionIndex(-1);

      if (question) {
        if (ANSWERS.includes(newText.toLowerCase())) {
          setSelectedAnswer(newText);
          return;
        } else {
          setSelectedAnswer('n');
        }
      }
      if (newText.startsWith('/')) {
        // Show command suggestions when text starts with '/'
        const matched = [...new Set([...COMMANDS, ...CONFIRM_COMMANDS])].filter((cmd) => cmd.toLowerCase().startsWith(newText.toLowerCase()));
        setFilteredSuggestions(matched);
        setSuggestionsVisible(matched.length > 0);
      } else if (word.length > 0) {
        const matched = words.filter((s) => s.toLowerCase().startsWith(word.toLowerCase()));
        setFilteredSuggestions(matched);
        setSuggestionsVisible(matched.length > 0);
      } else {
        setSuggestionsVisible(false);
      }

      if (inputRef.current) {
        const { selectionStart } = inputRef.current;
        const textBeforeCursor = newText.substring(0, selectionStart);
        const lines = textBeforeCursor.split('\n');
        const currentLineNumber = lines.length - 1;
        const currentLineText = lines[currentLineNumber];

        const lineHeight = 20;
        const charWidth = 8;

        setCursorPosition({
          top: currentLineNumber * lineHeight,
          left: currentLineText.length * charWidth,
        });
      }
    };

    const acceptSuggestion = (suggestion: string) => {
      if (inputRef.current) {
        const cursorPos = inputRef.current.selectionStart;
        const textBeforeCursor = text.slice(0, cursorPos);
        const lastSpaceIndex = textBeforeCursor.lastIndexOf(' ');
        const textAfterCursor = text.slice(cursorPos);

        // Check if suggestion is a command prefix
        const commandMatch = COMMANDS.find((cmd) => cmd === suggestion);
        const newText = commandMatch ? suggestion + ' ' + textAfterCursor : textBeforeCursor.slice(0, lastSpaceIndex + 1) + suggestion + textAfterCursor;

        setText(newText);
        setSuggestionsVisible(false);

        inputRef.current.focus();
        const newCursorPos = commandMatch ? suggestion.length + 1 : lastSpaceIndex + 1 + suggestion.length;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    };

    const prepareForNextPrompt = () => {
      setText('');
      setSuggestionsVisible(false);
      setHighlightedSuggestionIndex(-1);
      setHistoryIndex(-1);
    };

    const handleSubmit = () => {
      if (text) {
        const confirmCommandMatch = CONFIRM_COMMANDS.find((cmd) => text.startsWith(cmd));
        if (confirmCommandMatch) {
          invokeCommand(confirmCommandMatch);
        } else {
          window.api.sendPrompt(baseDir, text, editFormat);
          if (!editFormatLocked) {
            setEditFormat(defaultEditFormat);
          }
          onSubmitted?.(text, editFormat === defaultEditFormat ? undefined : editFormat);
        }
        prepareForNextPrompt();
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          window.api.runCommand(baseDir, 'paste');
          break;
        }
      }
    };

    const updateMainModel = (model: string) => {
      window.api.updateMainModel(baseDir, model);
      const updatedSettings = {
        ...settings,
        models: {
          ...settings.models,
          preferred: [model, ...settings.models.preferred.filter((m) => m !== model)],
        },
      };
      setSettings(updatedSettings);
      saveSettings(updatedSettings);
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Handle CTRL+C during processing
      if (processing && e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        interruptResponse();
        return;
      }

      if (question) {
        if (e.key === 'Tab') {
          e.preventDefault();
          const currentIndex = ANSWERS.indexOf(selectedAnswer?.toLowerCase() || 'y');
          if (currentIndex !== -1) {
            const nextIndex = (currentIndex + (e.shiftKey ? -1 : 1) + ANSWERS.length) % ANSWERS.length;
            setSelectedAnswer(ANSWERS[nextIndex]);
            return;
          }
        }
        if (e.key === 'Enter' && !e.shiftKey && ANSWERS.includes(selectedAnswer?.toLowerCase() || 'y')) {
          e.preventDefault();
          answerQuestion?.(selectedAnswer!);
          return;
        }
      }

      if (suggestionsVisible) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            if (highlightedSuggestionIndex !== -1) {
              acceptSuggestion(filteredSuggestions[highlightedSuggestionIndex]);
            } else if (!processing && !e.shiftKey) {
              handleSubmit();
            }
            break;
          case 'ArrowUp':
            e.preventDefault();
            setHighlightedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1));
            break;
          case 'ArrowDown':
            e.preventDefault();
            setHighlightedSuggestionIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
            break;
          case 'Tab':
            e.preventDefault();
            if (filteredSuggestions.length === 1) {
              acceptSuggestion(filteredSuggestions[0]);
            } else {
              setHighlightedSuggestionIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
            }
            break;
          case ' ':
            if (highlightedSuggestionIndex !== -1) {
              e.preventDefault();
              acceptSuggestion(filteredSuggestions[highlightedSuggestionIndex] + ' ');
            }
            break;
          case 'Escape':
            e.preventDefault();
            setSuggestionsVisible(false);
            break;
        }
      } else {
        switch (e.key) {
          case 'Enter':
            if (!e.shiftKey) {
              e.preventDefault();
              if (!processing) {
                handleSubmit();
              }
            }
            break;
          case 'ArrowUp':
            if (text === '' && inputHistory.length > 0) {
              e.preventDefault();
              const newIndex = historyIndex === -1 ? 0 : Math.min(historyIndex + 1, inputHistory.length - 1);
              setHistoryIndex(newIndex);
              setText(inputHistory[newIndex]);
            } else if (historyIndex !== -1) {
              e.preventDefault();
              const newIndex = Math.min(historyIndex + 1, inputHistory.length - 1);
              setHistoryIndex(newIndex);
              setText(inputHistory[newIndex]);
            }
            break;
          case 'ArrowDown':
            if (historyIndex !== -1) {
              e.preventDefault();
              const newIndex = historyIndex - 1;
              if (newIndex === -1) {
                setText('');
              } else {
                setText(inputHistory[newIndex]);
              }
              setHistoryIndex(newIndex);
            }
            break;
        }
      }
    };

    return (
      <div className="w-full relative">
        {question && (
          <div className="mb-2 p-3 bg-neutral-800 rounded-md border border-neutral-700 text-sm">
            <div className="text-white mb-2">{question.text}</div>
            {question.subject && <div className="text-neutral-400 text-xs mb-3">{question.subject}</div>}
            <div className="flex gap-2">
              <button
                onClick={() => answerQuestion?.('y')}
                className={`px-2 py-0.5 text-xs rounded hover:bg-neutral-700 border border-neutral-600 ${selectedAnswer === 'y' ? 'bg-neutral-700' : 'bg-neutral-800'}`}
                title="Yes (Y)"
              >
                (Y)es
              </button>
              <button
                onClick={() => answerQuestion?.('n')}
                className={`px-2 py-0.5 text-xs rounded hover:bg-neutral-700 border border-neutral-600 ${selectedAnswer === 'n' ? 'bg-neutral-700' : 'bg-neutral-800'}`}
                title="No (N)"
              >
                (N)o
              </button>
              <button
                onClick={() => answerQuestion?.('a')}
                className={`px-2 py-0.5 text-xs rounded hover:bg-neutral-700 border border-neutral-600 ${selectedAnswer === 'a' ? 'bg-neutral-700' : 'bg-neutral-800'}`}
                title="Always (A)"
              >
                (A)lways
              </button>
              <button
                onClick={() => answerQuestion?.('d')}
                className={`px-2 py-0.5 text-xs rounded hover:bg-neutral-700 border border-neutral-600 ${selectedAnswer === 'd' ? 'bg-neutral-700' : 'bg-neutral-800'}`}
                title="Don't ask again (D)"
              >
                (D)on&apos;t ask again
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-col">
          <div className="relative flex-shrink-0">
            <textarea
              ref={inputRef}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={question ? '...or suggest something else' : placeholder}
              rows={Math.max(text.split('\n').length, 1)}
              className="w-full px-2 py-2 border-2 border-neutral-700 rounded-md focus:outline-none focus:border-neutral-500 text-sm bg-neutral-850 text-white placeholder-neutral-600 resize-none overflow-y-auto transition-colors duration-200 max-h-[60vh] scrollbar-thin scrollbar-track-neutral-800 scrollbar-thumb-neutral-600 hover:scrollbar-thumb-neutral-600"
            />
            {processing ? (
              <div className="absolute right-3 top-1/2 -translate-y-[16px] flex items-center space-x-2 text-neutral-400">
                <button
                  onClick={interruptResponse}
                  className="hover:text-neutral-300 hover:bg-neutral-700 rounded p-1 transition-colors duration-200"
                  title="Stop response"
                >
                  <MdStop className="w-4 h-4" />
                </button>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!text.trim()}
                className={`absolute right-2 top-1/2 -translate-y-[16px] text-neutral-400 hover:text-neutral-300 hover:bg-neutral-700 rounded p-1 transition-all duration-200
                ${!text.trim() ? 'opacity-0' : 'opacity-100'}`}
                title="Send message (Enter)"
              >
                <BiSend className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="relative flex items-center text-sm text-neutral-400 w-full">
            <ModelSelector ref={modelSelectorRef} models={models} currentModel={currentModel} updateMainModel={updateMainModel} />
            <div className="relative" ref={formatSelectorRef}>
              <button
                onClick={() => setShowFormatSelector(!showFormatSelector)}
                className="flex items-center hover:text-neutral-300 focus:outline-none transition-colors duration-200 text-xs ml-4"
              >
                <MdKeyboardArrowUp className="w-3 h-3 mr-0.5" />
                <span className="capitalize">{editFormat}</span>
                {editFormat !== defaultEditFormat && (
                  <span className="ml-1">
                    {editFormatLocked ? (
                      <CgLock
                        className="w-4 h-4 focus:outline-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditFormatLocked(false);
                          inputRef.current?.focus();
                        }}
                      />
                    ) : (
                      <CgLockUnlock
                        className="w-4 h-4 focus:outline-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditFormatLocked(true);
                          inputRef.current?.focus();
                        }}
                      />
                    )}
                  </span>
                )}
              </button>
              {showFormatSelector && (
                <div className="absolute bottom-full left-4 mb-1 bg-neutral-900 border border-neutral-700 rounded-md shadow-lg z-10 ml-2">
                  {EDIT_FORMATS.map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => {
                        setEditFormat(value);
                        setShowFormatSelector(false);
                        if (value !== defaultEditFormat) {
                          setEditFormatLocked(false);
                        }
                      }}
                      className={`w-full px-3 py-1 text-left hover:bg-neutral-700 transition-colors duration-200 text-xs
                    ${value === editFormat ? 'text-white font-bold' : 'text-neutral-300'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-grow" />
          </div>
        </div>
        {suggestionsVisible && filteredSuggestions.length > 0 && (
          <div
            className="absolute bg-neutral-950 text-xs shadow-lg z-10 text-white
            scrollbar-thin
            scrollbar-track-neutral-900
            scrollbar-thumb-neutral-700
            hover:scrollbar-thumb-neutral-600"
            style={{
              bottom: `calc(100% - 4px - ${cursorPosition.top}px)`,
              left: `${cursorPosition.left}px`,
              maxHeight: '200px',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={index}
                ref={index === highlightedSuggestionIndex ? (el) => el?.scrollIntoView({ block: 'nearest' }) : null}
                className={`px-2 py-1 cursor-pointer ${index === highlightedSuggestionIndex ? 'bg-neutral-700' : 'hover:bg-neutral-700'}`}
                onClick={() => acceptSuggestion(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

PromptField.displayName = 'PromptField';
