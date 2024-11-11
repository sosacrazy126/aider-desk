import { KeyboardEvent, useState } from 'react';

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

type Props = {
  baseDir: string;
  onSubmit?: (prompt: string) => void;
};

export const PromptField = ({ baseDir, onSubmit }: Props) => {
  const [prompt, setPrompt] = useState('');
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);

  const handleSubmit = () => {
    if (prompt.trim()) {
      window.api.sendPrompt(baseDir, prompt.trim());
      setPrompt('');
      onSubmit?.(prompt.trim());

      // Reset placeholder after submission
      setPlaceholder(PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (event.ctrlKey || event.shiftKey) {
        // Insert new line when Ctrl+Enter is pressed
        setPrompt((prev) => prev + '\n');
      } else {
        handleSubmit();
      }
    }
  };

  return (
    <textarea
      value={prompt}
      onChange={(e) => setPrompt(e.target.value)}
      placeholder={placeholder}
      onKeyDown={handleKeyDown}
      rows={Math.max(prompt.split('\n').length, 1)}
      className="w-full px-2 py-2 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-gray-400 text-sm bg-gray-800 text-white placeholder-gray-500 resize-none overflow-y-auto"
    />
  );
};
