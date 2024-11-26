import { useState, useRef, useEffect } from 'react';

type Props = {
  value: string;
  suggestions: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rightElement?: React.ReactNode;
  autoFocus?: boolean;
};

export const AutocompletionInput = ({ value, suggestions, onChange, placeholder, className, rightElement, autoFocus }: Props) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setShowSuggestions(suggestions.length > 0);
    setSelectedIndex(-1);
  }, [suggestions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault();
          onChange(suggestions[selectedIndex]);
          setShowSuggestions(false);
        }
        break;
      case 'Tab':
        if (suggestions.length > 0 || selectedIndex >= 0) {
          e.preventDefault();
          onChange(suggestions[selectedIndex >= 0 ? selectedIndex : 0]);
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        className={className}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      {rightElement}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute w-full mt-1 py-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className={`px-3 py-2 cursor-pointer hover:bg-neutral-700 ${index === selectedIndex ? 'bg-neutral-700' : ''}`}
              onMouseEnter={() => setSelectedIndex(index)}
              onMouseDown={() => {
                onChange(suggestion);
                setShowSuggestions(false);
              }}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
