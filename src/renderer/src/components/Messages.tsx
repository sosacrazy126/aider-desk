import { useEffect, useRef } from 'react';
import { Message } from 'types/message';
import { MessageBlock } from './MessageBlock';

type Props = {
  messages: Message[];
};

export const Messages = ({ messages }: Props) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div
      className="flex flex-col overflow-y-auto max-h-full p-4
      scrollbar-thin
      scrollbar-track-neutral-900
      scrollbar-thumb-neutral-700
      hover:scrollbar-thumb-neutral-600"
    >
      {messages.map((message, index) => (
        <MessageBlock key={index} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
