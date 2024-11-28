import { isLoadingMessage, isErrorMessage, isModelsMessage, Message } from 'types/message';
import { parseMessageContent } from 'utils/message';
import { BiCopy } from 'react-icons/bi';
import { Tooltip } from 'react-tooltip';
import { showInfoNotification } from 'utils/notifications';

type Props = {
  message: Message;
  allFiles: string[];
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  showInfoNotification('Copied to clipboard');
};

export const MessageBlock = ({ message, allFiles }: Props) => {
  const baseClasses = 'rounded-md p-3 mb-2 max-w-full break-words whitespace-pre-wrap text-xs bg-neutral-850 border border-neutral-800 text-gray-100';

  if (isLoadingMessage(message)) {
    return (
      <div className={`${baseClasses} text-neutral-500 animate-pulse relative group`}>
        {message.content}
        <BiCopy
          data-tooltip-id={`copy-tooltip-${message.id}`}
          data-tooltip-content="Copy to clipboard"
          onClick={() => copyToClipboard(message.content)}
          className="absolute top-2 right-2 h-4 w-4 text-neutral-600 opacity-0 group-hover:opacity-100 cursor-pointer hover:text-neutral-300 transition-opacity focus:outline-none"
        />
        <Tooltip id={`copy-tooltip-${message.id}`} place="top" className="z-50" />
      </div>
    );
  }

  if (isErrorMessage(message)) {
    return (
      <div className={`${baseClasses} bg-red-900/30 border-red-800/50 text-red-200 relative group`}>
        <div className="font-semibold mb-1">Error</div>
        {message.content}
        <BiCopy
          data-tooltip-id={`copy-tooltip-${message.id}`}
          data-tooltip-content="Copy to clipboard"
          onClick={() => copyToClipboard(message.content)}
          className="absolute top-2 right-2 h-4 w-4 text-red-600 opacity-0 group-hover:opacity-100 cursor-pointer hover:text-red-300 transition-opacity focus:outline-none"
        />
        <Tooltip id={`copy-tooltip-${message.id}`} />
      </div>
    );
  }

  if (isModelsMessage(message)) {
    return (
      <div className={`${baseClasses} bg-gray-900 border-gray-600 text-neutral-300 relative group`}>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <span className="opacity-60 text-xs">Main model:</span>
            <span className="text-neutral-400">{message.models.name}</span>
          </div>
          <div className="h-3 w-px bg-neutral-600/50"></div>
          <div className="flex items-center space-x-1">
            <span className="opacity-60 text-xs">Weak model:</span>
            <span className="text-neutral-400">{message.models.weakModel}</span>
          </div>
          {message.models.maxChatHistoryTokens && (
            <>
              <div className="h-3 w-px bg-neutral-600/50"></div>
              <div className="flex items-center space-x-1">
                <span className="opacity-60 text-xs">Max tokens:</span>
                <span className="text-neutral-400">{message.models.maxChatHistoryTokens}</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClasses} relative group`}>
      {parseMessageContent(message.content, allFiles)}
      <BiCopy
        data-tooltip-id={`copy-tooltip-${message.id}`}
        data-tooltip-content="Copy to clipboard"
        onClick={() => copyToClipboard(message.content)}
        className="absolute top-2 right-2 h-4 w-4 text-neutral-600 opacity-0 group-hover:opacity-100 cursor-pointer hover:text-neutral-300 transition-opacity f "
      />
      <Tooltip id={`copy-tooltip-${message.id}`} />
    </div>
  );
};
