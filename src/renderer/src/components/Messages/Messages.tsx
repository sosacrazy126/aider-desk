import { useEffect, useRef, useState } from 'react';
import { Message } from 'types/message';
import { MessageBlock } from './MessageBlock';

type Props = {
  baseDir: string;
  messages: Message[];
  allFiles?: string[];
};

export const Messages = ({ baseDir, messages, allFiles = [] }: Props) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [scrollingPaused, setScrollingPaused] = useState(false);

  const handleScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop === element.clientHeight;
    setScrollingPaused(!isAtBottom);
  };

  useEffect(() => {
    const hasLoadingMessage = messages.some((msg) => msg.type === 'loading');
    if (hasLoadingMessage) {
      setScrollingPaused(false);
    }

    if (hasLoadingMessage || !scrollingPaused) {
      messagesEndRef.current?.scrollIntoView();
    }
  }, [messages, scrollingPaused]);

  return (
    <div
      className="flex flex-col overflow-y-auto max-h-full p-4
      scrollbar-thin
      scrollbar-track-neutral-900
      scrollbar-thumb-neutral-700
      hover:scrollbar-thumb-neutral-600"
      onWheel={handleScroll}
    >
      {messages.map((message, index) => (
        <MessageBlock key={index} baseDir={baseDir} message={message} allFiles={allFiles} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
