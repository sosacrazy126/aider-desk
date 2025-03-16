import { useState } from 'react';
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from 'react-icons/md';
import { CgSpinner } from 'react-icons/cg';

import { ToolMessage } from '@/types/message';

type Props = {
  message: ToolMessage;
};

export const ToolMessageBlock = ({ message }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isExecuting = message.content === '';

  return (
    <div className="rounded-md p-3 mb-2 max-w-full break-words whitespace-pre-wrap text-xs bg-neutral-900/50 border border-neutral-800/50 text-neutral-400">
      <div className="flex items-center cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? <MdKeyboardArrowDown className="mr-2" /> : <MdKeyboardArrowRight className="mr-2" />}
        <span className="opacity-70 text-xs">
          Tool: {message.serverName}/{message.toolName}
        </span>
        {isExecuting && <CgSpinner className="animate-spin ml-2 w-3 h-3" />}
      </div>
      {isExpanded && (
        <>
          {Object.keys(message.args).length > 0 && (
            <div className="mt-2 text-xs">
              <div className="font-semibold mb-1">Arguments:</div>
              <pre className="whitespace-pre-wrap">{JSON.stringify(message.args, null, 2)}</pre>
            </div>
          )}
          {isExecuting ? (
            <div className="mt-2 text-xs italic">Tool is executing...</div>
          ) : (
            message.content && (
              <div className="mt-2 text-xs">
                <div className="font-semibold mb-1">Result:</div>
                <pre className="whitespace-pre-wrap">{message.content}</pre>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};
