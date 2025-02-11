import { createPortal } from 'react-dom';
import { useState, useRef, useEffect, ReactNode } from 'react';

type Props = {
  value: string;
  suggestions: string[];
  onChange: (value: string, isFromSuggestion: boolean) => void;
  placeholder?: string;
  className?: string;
  rightElement?: ReactNode;
  autoFocus?: boolean;
  onSubmit?: () => void;
};

export const AutocompletionInput = ({ value, suggestions, onChange, placeholder, className, rightElement, autoFocus, onSubmit }: Props) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setShowSuggestions(suggestions.length > 0);
    setSelectedIndex(-1);
  }, [suggestions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === 'Enter' && onSubmit) {
        e.preventDefault();
        onSubmit();
      } else if (e.key === 'Tab') {
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => {
          const newIndex = Math.min(prev + 1, suggestions.length - 1);
          const suggestionElement = document.getElementById(`suggestion-${newIndex}`);
          suggestionElement?.scrollIntoView({ block: 'nearest' });
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => {
          const newIndex = Math.max(prev - 1, 0);
          if (newIndex >= 0) {
            const suggestionElement = document.getElementById(`suggestion-${newIndex}`);
            suggestionElement?.scrollIntoView({ block: 'nearest' });
          }
          return newIndex;
        });
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault();
          onChange(suggestions[selectedIndex], true);
          setShowSuggestions(false);
        } else if (onSubmit) {
          e.preventDefault();
          onSubmit();
        }
        break;
      case 'Tab':
        if (suggestions.length > 0 || selectedIndex >= 0) {
          e.preventDefault();
          onChange(suggestions[selectedIndex >= 0 ? selectedIndex : 0], true);
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        setShowSuggestions(false);
        break;
    }
  };

  const renderSuggestions = () => {
    if (!showSuggestions || suggestions.length === 0) {
      return null;
    }

    const inputRect = inputRef.current?.getBoundingClientRect();
    if (!inputRect) {
      return null;
    }

    const style = {
      position: 'absolute' as const,
      top: `${inputRect.bottom + window.scrollY}px`,
      left: `${inputRect.left + window.scrollX}px`,
      width: `${inputRect.width}px`,
      zIndex: 1000, // Ensure it's above other elements
    };

    return createPortal(
      <div
        className="w-full mt-1 p-0.5 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto scrollbar-thin scrollbar-track-neutral-800 scrollbar-thumb-neutral-600 scrollbar-thumb-rounded-full"
        style={style}
      >
        {suggestions.map((suggestion, index) => (
          <div
            id={`suggestion-${index}`}
            key={suggestion}
            className={`px-3 py-1 text-sm cursor-pointer hover:bg-neutral-700 ${index === selectedIndex ? 'bg-neutral-700' : ''}`}
            onMouseEnter={() => setSelectedIndex(index)}
            onMouseDown={() => {
              onChange(suggestion, true);
              setShowSuggestions(false);
            }}
          >
            {suggestion}
          </div>
        ))}
      </div>,
      document.body,
    );
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        className={className}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value, false)}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      {rightElement}
      {renderSuggestions()}
    </div>
  );
};
