import { isLoadingMessage, Message } from 'types/message';
import { parseMessageContent } from 'utils/message';

type Props = {
  message: Message;
  allFiles: string[];
};

export const MessageBlock = ({ message, allFiles }: Props) => {
  const baseClasses = 'rounded-md p-3 mb-2 max-w-full break-words whitespace-pre-wrap text-xs bg-neutral-850 border border-neutral-800 text-gray-100';

  if (isLoadingMessage(message)) {
    return <div className={`${baseClasses} text-neutral-500 animate-pulse`}>{message.content}</div>;
  }

  return <div className={`${baseClasses}`}>{parseMessageContent(message.content, allFiles)}</div>;
};
