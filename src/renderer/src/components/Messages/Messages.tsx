import { useEffect, useRef, useState } from 'react';
import { Message } from 'types/message';
import { MessageBlock } from './MessageBlock';

type Props = {
  messages: Message[];
  allFiles?: string[];
};

export const Messages = ({ messages, allFiles = [] }: Props) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasUserScrolled, setHasUserScrolled] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop === element.clientHeight;
    setHasUserScrolled(!isAtBottom);
  };

  useEffect(() => {
    const hasLoadingMessage = messages.some((msg) => msg.type === 'loading');
    if (hasLoadingMessage) {
      setHasUserScrolled(false);
    }

    if (hasLoadingMessage || !hasUserScrolled) {
      messagesEndRef.current?.scrollIntoView();
    }
  }, [messages, hasUserScrolled]);

  return (
    <div
      className="flex flex-col overflow-y-auto max-h-full p-4
      scrollbar-thin
      scrollbar-track-neutral-900
      scrollbar-thumb-neutral-700
      hover:scrollbar-thumb-neutral-600"
      onScroll={handleScroll}
    >
      {messages.map((message, index) => (
        <MessageBlock key={index} message={message} allFiles={allFiles} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
