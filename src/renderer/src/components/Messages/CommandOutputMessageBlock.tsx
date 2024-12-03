import { BiTerminal } from 'react-icons/bi';
import { CommandOutputMessage } from 'types/message';
import { CopyMessageButton } from './CopyMessageButton';

type Props = {
  message: CommandOutputMessage;
};

export const CommandOutputMessageBlock = ({ message }: Props) => {
  const baseClasses = 'rounded-md p-3 mb-2 max-w-full break-words whitespace-pre-wrap text-xs bg-neutral-900 border border-neutral-800 text-gray-100';

  return (
    <div className={`${baseClasses} bg-neutral-900 border-neutral-800 text-neutral-300 relative group`}>
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <BiTerminal className="text-neutral-500 h-4 w-4" />
          <div className="flex items-center space-x-1">
            <span className="opacity-60 text-xs">Command:</span>
            <span className="text-neutral-400">{message.command}</span>
          </div>
        </div>
      </div>
      {message.content && <div className="mt-2 p-2 bg-gray-950 border border-neutral-800 text-xs whitespace-pre-wrap">{message.content}</div>}
      <div className="absolute top-2 right-2">
        <CopyMessageButton content={message.content} className="text-neutral-600 hover:text-neutral-300" />
      </div>
    </div>
  );
};
