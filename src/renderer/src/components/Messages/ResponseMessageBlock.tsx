import { ResponseMessage } from 'types/message';
import { CopyMessageButton } from './CopyMessageButton';
import { parseMessageContent } from './utils';

type Props = {
  baseDir: string;
  message: ResponseMessage;
  allFiles: string[];
};

export const ResponseMessageBlock = ({ baseDir, message, allFiles }: Props) => {
  const baseClasses = 'rounded-md p-3 mb-2 max-w-full break-words whitespace-pre-wrap text-xs bg-neutral-850 border border-neutral-800 text-gray-100';

  return (
    <div className={`${baseClasses} relative flex flex-col group`}>
      <div className={`flex-1 max-w-full ${message.content ? 'pb-2' : ''}`}>
        {message.content ? parseMessageContent(baseDir, message.content, allFiles) : 'Thinking...'}
      </div>
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <CopyMessageButton content={message.content} className="text-neutral-600 hover:text-neutral-300" />
      </div>
      {message.usageReport && (
        <div
          className="absolute bottom-2 right-2 flex items-center gap-2
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300 ease-in-out  px-2 py-1 rounded-md
          bg-neutral-900 border border-neutral-700"
        >
          <span className="text-xs text-neutral-300 hover:text-neutral-100">
            {message.usageReport.sentTokens} tokens sent, {message.usageReport.receivedTokens} tokens received, cost: $
            {message.usageReport.messageCost.toFixed(5)}
          </span>
        </div>
      )}
    </div>
  );
};
