import { CgTerminal } from 'react-icons/cg';
import { FaRegQuestionCircle } from 'react-icons/fa';
import { IoConstruct } from 'react-icons/io5';

import { CopyMessageButton } from './CopyMessageButton';
import { parseMessageContent } from './utils';

import { PromptMessage } from '@/types/message';

type Props = {
  baseDir: string;
  message: PromptMessage;
  allFiles: string[];
};

export const PromptMessageBlock = ({ baseDir, message, allFiles }: Props) => {
  const baseClasses = 'rounded-md p-3 mb-2 max-w-full break-words whitespace-pre-wrap text-xs bg-neutral-850 border border-neutral-800 text-gray-100';

  return (
    <div className={`${baseClasses} relative flex items-start gap-3 group`}>
      <div className="flex items-center">
        {(message.editFormat === 'code' || !message.editFormat) && <CgTerminal className="text-neutral-200 h-[18px]" />}
        {message.editFormat === 'ask' && <FaRegQuestionCircle className="text-neutral-200 h-[18px]" />}
        {message.editFormat === 'architect' && <IoConstruct className="text-neutral-200 h-[18px]" />}
      </div>
      <div className="flex-grow-1">{parseMessageContent(baseDir, message.content, allFiles)}</div>
      <div className="absolute top-2 right-2">
        <CopyMessageButton content={message.content} className="text-neutral-600 hover:text-neutral-300" />
      </div>
    </div>
  );
};
