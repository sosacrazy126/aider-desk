import React, { useRef, useState, useEffect } from 'react';
import { BiSend } from 'react-icons/bi';
import { QuestionData } from '@common/types';

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
  isActive?: boolean;
  words?: string[];
};

export const PromptField = ({ baseDir, onSubmit, processing = false, isActive = false, words = [] }: Props) => {
  const [text, setText] = useState('');
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  const [placeholder] = useState(PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(-1);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    const questionListenerId = window.api.addAskQuestionListener(baseDir, (_, data) => {
      setQuestion(data);
    });

    return () => {
      window.api.removeAskQuestionListener(questionListenerId);
    };
  }, [baseDir]);

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

  const handleSuggestionClick = (suggestion: string) => {
    if (inputRef.current) {
      const cursorPos = inputRef.current.selectionStart;
      const textBeforeCursor = text.slice(0, cursorPos);
      const lastSpaceIndex = textBeforeCursor.lastIndexOf(' ');
      const textAfterCursor = text.slice(cursorPos);

      // Check if suggestion is an edit format prefix
      const editFormatMatch = EDIT_FORMATS.find((format) => format.prefix === suggestion);
      const newText = editFormatMatch ? suggestion + ' ' + textAfterCursor : textBeforeCursor.slice(0, lastSpaceIndex + 1) + suggestion + textAfterCursor;

      setText(newText);
      setSuggestionsVisible(false);

      inputRef.current.focus();
      const newCursorPos = editFormatMatch ? suggestion.length + 1 : lastSpaceIndex + 1 + suggestion.length;
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
    const [prompt, editFormat] = getPromptWithEditFormat(text);

    if (prompt) {
      window.api.sendPrompt(baseDir, prompt, editFormat);
      onSubmit?.(prompt);
      prepareForNextPrompt();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (question) {
      const answers = ['y', 'n', 'a', 'd'];
      if (e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = answers.indexOf(question.defaultAnswer);
        const nextIndex = (currentIndex + (e.shiftKey ? -1 : 1) + answers.length) % answers.length;
        setQuestion({ ...question, defaultAnswer: answers[nextIndex] });
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        answerQuestion(question.defaultAnswer);
        return;
      }
    }

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

  const answerQuestion = (answer: string) => {
    if (question) {
      window.api.answerQuestion(baseDir, answer);
      setQuestion(null);
      prepareForNextPrompt();
    }
  };

  return (
    <div className="w-full relative">
      {question && (
        <div className="mb-2 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-white mb-2">{question.text}</div>
          {question.subject && <div className="text-gray-400 text-sm mb-3">{question.subject}</div>}
          <div className="flex gap-2">
            <button
              onClick={() => answerQuestion('y')}
              className={`px-2 py-0.5 text-sm rounded hover:bg-gray-700 border border-gray-600 ${question.defaultAnswer === 'y' ? 'bg-gray-700' : 'bg-gray-800'}`}
              title="Yes (Y)"
            >
              (Y)es
            </button>
            <button
              onClick={() => answerQuestion('n')}
              className={`px-2 py-0.5 text-sm rounded hover:bg-gray-700 border border-gray-600 ${question.defaultAnswer === 'n' ? 'bg-gray-700' : 'bg-gray-800'}`}
              title="No (N)"
            >
              (N)o
            </button>
            <button
              onClick={() => answerQuestion('a')}
              className={`px-2 py-0.5 text-sm rounded hover:bg-gray-700 border border-gray-600 ${question.defaultAnswer === 'a' ? 'bg-gray-700' : 'bg-gray-800'}`}
              title="Always (A)"
            >
              (A)lways
            </button>
            <button
              onClick={() => answerQuestion('d')}
              className={`px-2 py-0.5 text-sm rounded hover:bg-gray-700 border border-gray-600 ${question.defaultAnswer === 'd' ? 'bg-gray-700' : 'bg-gray-800'}`}
              title="Don't ask again (D)"
            >
              (D)on&apos;t ask again
            </button>
          </div>
        </div>
      )}
      <textarea
        ref={inputRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={question ? '...or suggest something else' : placeholder}
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
