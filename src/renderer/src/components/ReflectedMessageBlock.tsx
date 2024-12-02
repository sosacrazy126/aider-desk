import { useState } from 'react';
import { Message } from 'types/message';
import { parseMessageContent } from 'utils/message';
import { BiCopy } from 'react-icons/bi';
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from 'react-icons/md';
import { Tooltip } from 'react-tooltip';
import { showInfoNotification } from 'utils/notifications';

type Props = {
  message: Message;
  allFiles: string[];
};

export const ReflectedMessageBlock = ({ message, allFiles }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-md p-3 mb-2 max-w-full break-words whitespace-pre-wrap text-xs bg-neutral-900/50 border border-neutral-800/50 text-neutral-400 relative group">
      <div className="flex items-center cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? <MdKeyboardArrowDown className="mr-2" /> : <MdKeyboardArrowRight className="mr-2" />}
        <span className="opacity-70 text-xs">Reflected Message</span>
      </div>
      {isExpanded && (
        <div className="mt-2">
          {parseMessageContent(message.content, allFiles)}
          <BiCopy
            data-tooltip-id={`copy-tooltip-${message.id}`}
            data-tooltip-content="Copy to clipboard"
            onClick={() => {
              navigator.clipboard.writeText(message.content);
              showInfoNotification('Copied to clipboard');
            }}
            className="absolute top-2 right-2 h-4 w-4 text-neutral-600 opacity-0 group-hover:opacity-100 cursor-pointer hover:text-neutral-300 transition-opacity"
          />
          <Tooltip id={`copy-tooltip-${message.id}`} />
        </div>
      )}
    </div>
  );
};
