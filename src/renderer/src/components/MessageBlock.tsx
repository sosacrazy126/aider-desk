import { isLoadingMessage, isResponseErrorMessage, isModelsMessage, Message } from 'types/message';
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

  if (isResponseErrorMessage(message)) {
    return (
      <div className={`${baseClasses} bg-red-900/30 border-red-800/50 text-red-200`}>
        <div className="font-semibold mb-1">Error</div>
        {message.content}
      </div>
    );
  }

  if (isModelsMessage(message)) {
    return (
      <div className={`${baseClasses} bg-gray-900 border-gray-600 text-neutral-300`}>
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

  return <div className={`${baseClasses}`}>{parseMessageContent(message.content, allFiles)}</div>;
};
