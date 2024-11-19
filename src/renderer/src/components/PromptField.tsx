import React, { useRef, useState, useEffect } from 'react';
import { BiSend } from 'react-icons/bi';

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

const EDIT_FORMATS = [
  { prefix: '/code', format: 'code' },
  { prefix: '/ask', format: 'ask' },
  { prefix: '/architect', format: 'architect' },
];

const getPromptWithEditFormat = (prompt: string): [string, string | undefined] => {
  for (const { prefix, format } of EDIT_FORMATS) {
    if (prompt.startsWith(prefix)) {
      return [prompt.replace(prefix, '').trim(), format];
    }
  }
  return [prompt.trim(), undefined];
};

type Props = {
  baseDir: string;
  onSubmit?: (prompt: string) => void;
  processing?: boolean;
  test?: string;
};

export const PromptField: React.FC<Props> = ({ baseDir, onSubmit, processing = false }) => {
  const [text, setText] = useState('');
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  const [placeholder] = useState(PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(-1);
  const [autocompletionWords, setAutocompletionWords] = useState<string[]>([]);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    const listenerId = window.api.addUpdateAutocompletionListener(baseDir, (_, { words }) => {
      setAutocompletionWords(words);
    });

    return () => {
      window.api.removeUpdateAutocompletionListener(listenerId);
    };
  }, [baseDir]);

  useEffect(() => {
    if (processing) {
      return;
    }
    void loadHistory();
    // intentionally omitting loadHistory
  }, [processing, baseDir]);

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

    if (newText.startsWith('/')) {
      // Show edit format suggestions when text starts with '/'
      const matched = EDIT_FORMATS.filter((format) => format.prefix.toLowerCase().startsWith(newText.toLowerCase())).map((format) => format.prefix);
      setFilteredSuggestions(matched);
      setSuggestionsVisible(matched.length > 0);
    } else if (word.length > 0) {
      const matched = autocompletionWords.filter((s) => s.toLowerCase().startsWith(word.toLowerCase()));
      setFilteredSuggestions(matched);
      setSuggestionsVisible(matched.length > 0);
    } else {
      setSuggestionsVisible(false);
    }

    if (textareaRef.current) {
      const { selectionStart } = textareaRef.current;
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

  const handleSuggestionClick = (suggestion: string) => {
    if (textareaRef.current) {
      const cursorPos = textareaRef.current.selectionStart;
      const textBeforeCursor = text.slice(0, cursorPos);
      const lastSpaceIndex = textBeforeCursor.lastIndexOf(' ');
      const textAfterCursor = text.slice(cursorPos);

      // Check if suggestion is an edit format prefix
      const editFormatMatch = EDIT_FORMATS.find((format) => format.prefix === suggestion);
      const newText = editFormatMatch ? suggestion + ' ' + textAfterCursor : textBeforeCursor.slice(0, lastSpaceIndex + 1) + suggestion + textAfterCursor;

      setText(newText);
      setSuggestionsVisible(false);

      textareaRef.current.focus();
      const newCursorPos = editFormatMatch ? suggestion.length + 1 : lastSpaceIndex + 1 + suggestion.length;
      textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
    }
  };

  const prepareForNextPrompt = () => {
    setText('');
    setSuggestionsVisible(false);
    setHighlightedSuggestionIndex(-1);
    setHistoryIndex(-1);
  };

  const handleSubmit = () => {
    const [prompt, editFormat] = getPromptWithEditFormat(text);

    if (prompt) {
      window.api.sendPrompt(baseDir, prompt, editFormat);
      onSubmit?.(prompt);
      prepareForNextPrompt();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestionsVisible) {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (highlightedSuggestionIndex !== -1) {
            handleSuggestionClick(filteredSuggestions[highlightedSuggestionIndex]);
          } else if (filteredSuggestions.length > 0) {
            handleSuggestionClick(filteredSuggestions[0]);
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
          if (highlightedSuggestionIndex !== -1) {
            handleSuggestionClick(filteredSuggestions[highlightedSuggestionIndex]);
          } else if (filteredSuggestions.length > 0) {
            handleSuggestionClick(filteredSuggestions[0]);
          }
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
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={Math.max(text.split('\n').length, 1)}
        className="w-full px-2 py-2 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-gray-400 text-sm bg-gray-800 text-white placeholder-gray-500 resize-none overflow-y-auto"
      />
      {processing ? (
        <div className="absolute right-3 top-1/2 -translate-y-[12px] text-neutral-400">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className={`absolute right-3 top-1/2 -translate-y-[12px] text-neutral-400 hover:text-neutral-300 transition-all duration-200
            ${!text.trim() ? 'opacity-0' : 'opacity-100'}`}
          title="Send message (Enter)"
        >
          <BiSend className="w-4 h-4" />
        </button>
      )}
      {suggestionsVisible && filteredSuggestions.length > 0 && (
        <div
          className="absolute bg-neutral-950 text-xs shadow-lg z-10 text-white"
          style={{
            bottom: `calc(100% - 4px - ${cursorPosition.top}px)`,
            left: `${cursorPosition.left}px`,
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`px-2 py-1 cursor-pointer ${index === highlightedSuggestionIndex ? 'bg-neutral-700' : 'hover:bg-neutral-700'}`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
