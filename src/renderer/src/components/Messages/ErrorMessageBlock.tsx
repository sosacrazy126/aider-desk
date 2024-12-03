import { Message } from 'types/message';
import { CopyMessageButton } from './CopyMessageButton';

type Props = {
  message: Message;
};

export const ErrorMessageBlock = ({ message }: Props) => {
  const baseClasses = 'rounded-md p-3 mb-2 max-w-full break-words whitespace-pre-wrap text-xs bg-neutral-850 border border-neutral-800 text-gray-100';

  return (
    <div className={`${baseClasses} bg-red-900/30 border-red-800/50 text-red-200 relative group`}>
      <div className="font-semibold mb-1">Error</div>
      {message.content}
      <div className="absolute top-2 right-2">
        <CopyMessageButton content={message.content} className="text-red-600 hover:text-red-300" />
      </div>
    </div>
  );
};
