import { isLoadingMessage, Message } from 'types/message';
import { parseContent } from 'utils/message';

type Props = {
  message: Message;
};

export const MessageBlock = ({ message }: Props) => {
  const baseClasses = 'rounded-md p-3 mb-2 max-w-full break-words whitespace-pre-wrap text-xs bg-gray-800 text-gray-100';

  if (isLoadingMessage(message)) {
    return <div className={`${baseClasses} text-neutral-500 animate-pulse`}>{message.content}</div>;
  }

  return <div className={`${baseClasses}`}>{parseContent(message.content)}</div>;
};
