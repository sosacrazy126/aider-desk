import { useState } from 'react';
import { Message } from 'types/message';
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from 'react-icons/md';
import { parseMessageContent } from './utils';
import { CopyMessageButton } from './CopyMessageButton';

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
          <div className="absolute top-2 right-2">
            <CopyMessageButton 
              content={message.content} 
              className="text-neutral-600 hover:text-neutral-300" 
            />
          </div>
        </div>
      )}
    </div>
  );
};
