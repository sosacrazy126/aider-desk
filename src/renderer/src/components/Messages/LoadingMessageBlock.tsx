import { Message } from 'types/message';

type Props = {
  message: Message;
};

export const LoadingMessageBlock = ({ message }: Props) => {
  const baseClasses = 'rounded-md p-3 mb-2 max-w-full break-words whitespace-pre-wrap text-xs bg-neutral-850 border border-neutral-800 text-gray-100';
  return <div className={`${baseClasses} text-neutral-500 animate-pulse relative group`}>{message.content}</div>;
};
