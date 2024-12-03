import { CgTerminal } from 'react-icons/cg';
import { FaRegQuestionCircle } from 'react-icons/fa';
import { IoConstruct } from 'react-icons/io5';
import {
  isCommandOutputMessage,
  isErrorMessage,
  isLoadingMessage,
  isModelsMessage,
  isPromptMessage,
  isReflectedMessage,
  isWarningMessage,
  Message,
} from 'types/message';
import { CommandOutputMessageBlock } from './CommandOutputMessageBlock';
import { CopyMessageButton } from './CopyMessageButton';
import { ErrorMessageBlock } from './ErrorMessageBlock';
import { LoadingMessageBlock } from './LoadingMessageBlock';
import { ModelsMessageBlock } from './ModelsMessageBlock';
import { ReflectedMessageBlock } from './ReflectedMessageBlock';
import { parseMessageContent } from './utils';
import { WarningMessageBlock } from './WarningMessageBlock';

type Props = {
  message: Message;
  allFiles: string[];
};

export const MessageBlock = ({ message, allFiles }: Props) => {
  const baseClasses = 'rounded-md p-3 mb-2 max-w-full break-words whitespace-pre-wrap text-xs bg-neutral-850 border border-neutral-800 text-gray-100';

  if (isLoadingMessage(message)) {
    return <LoadingMessageBlock message={message} />;
  }

  if (isWarningMessage(message)) {
    return <WarningMessageBlock message={message} />;
  }

  if (isErrorMessage(message)) {
    return <ErrorMessageBlock message={message} />;
  }

  if (isModelsMessage(message)) {
    return <ModelsMessageBlock message={message} />;
  }

  if (isReflectedMessage(message)) {
    return <ReflectedMessageBlock message={message} allFiles={allFiles} />;
  }

  if (isCommandOutputMessage(message)) {
    return <CommandOutputMessageBlock message={message} />;
  }

  return (
    <div className={`${baseClasses} relative flex items-start gap-3`}>
      {isPromptMessage(message) && (
        <div className="flex items-center">
          {(message.editFormat === 'code' || !message.editFormat) && <CgTerminal className="text-neutral-600 h-[18px]" />}
          {message.editFormat === 'ask' && <FaRegQuestionCircle className="text-neutral-600 h-[18px]" />}
          {message.editFormat === 'architect' && <IoConstruct className="text-neutral-600 h-[18px]" />}
        </div>
      )}
      <div className="flex-1">{parseMessageContent(message.content, allFiles)}</div>
      <div className="absolute top-2 right-2">
        <CopyMessageButton content={message.content} className="text-neutral-600 hover:text-neutral-300" />
      </div>
    </div>
  );
};
