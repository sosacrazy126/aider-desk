import { Message } from 'types/message';
import { CopyMessageButton } from './CopyMessageButton';

type Props = {
  message: Message;
};

export const WarningMessageBlock = ({ message }: Props) => {
  const baseClasses = 'rounded-md p-3 mb-2 max-w-full break-words whitespace-pre-wrap text-xs bg-neutral-850 border border-neutral-800 text-gray-100';

  return (
    <div className={`${baseClasses} bg-yellow-900/30 border-yellow-800/50 text-yellow-200 relative group`}>
      <div className="font-semibold mb-1">Warning</div>
      {message.content}
      <div className="absolute top-2 right-2">
        <CopyMessageButton content={message.content} className="text-yellow-600 hover:text-yellow-300" />
      </div>
    </div>
  );
};
