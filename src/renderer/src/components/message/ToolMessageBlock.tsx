import { useState } from 'react';
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from 'react-icons/md';

import { ToolMessage } from '@/types/message';

type Props = {
  message: ToolMessage;
};

export const ToolMessageBlock = ({ message }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-md p-3 mb-2 max-w-full break-words whitespace-pre-wrap text-xs bg-neutral-900/50 border border-neutral-800/50 text-neutral-400">
      <div className="flex items-center cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? <MdKeyboardArrowDown className="mr-2" /> : <MdKeyboardArrowRight className="mr-2" />}
        <span className="opacity-70 text-xs">Using tool: {message.toolName}</span>
      </div>
      {isExpanded && Object.keys(message.args).length > 0 && (
        <div className="mt-2 text-xs">
          <pre>{JSON.stringify(message.args, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
