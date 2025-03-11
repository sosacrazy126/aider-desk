import { CommandOutputMessageBlock } from './CommandOutputMessageBlock';
import { LoadingMessageBlock } from './LoadingMessageBlock';
import { LogMessageBlock } from './LogMessageBlock';
import { ModelsMessageBlock } from './ModelsMessageBlock';
import { UserMessageBlock } from './UserMessageBlock';
import { ReflectedMessageBlock } from './ReflectedMessageBlock';
import { ResponseMessageBlock } from './ResponseMessageBlock';

import {
  isCommandOutputMessage,
  isLogMessage,
  isLoadingMessage,
  isModelsMessage,
  isUserMessage,
  isReflectedMessage,
  isResponseMessage,
  Message,
  isToolMessage,
} from '@/types/message';
import { ToolMessageBlock } from '@/components/message/ToolMessageBlock';

type Props = {
  baseDir: string;
  message: Message;
  allFiles: string[];
};

export const MessageBlock = ({ baseDir, message, allFiles }: Props) => {
  if (isLoadingMessage(message)) {
    return <LoadingMessageBlock message={message} />;
  }

  if (isLogMessage(message)) {
    return <LogMessageBlock message={message} />;
  }

  if (isModelsMessage(message)) {
    return <ModelsMessageBlock message={message} />;
  }

  if (isReflectedMessage(message)) {
    return <ReflectedMessageBlock baseDir={baseDir} message={message} allFiles={allFiles} />;
  }

  if (isCommandOutputMessage(message)) {
    return <CommandOutputMessageBlock message={message} />;
  }

  if (isUserMessage(message)) {
    return <UserMessageBlock baseDir={baseDir} message={message} allFiles={allFiles} />;
  }

  if (isResponseMessage(message)) {
    return <ResponseMessageBlock baseDir={baseDir} message={message} allFiles={allFiles} />;
  }

  if (isToolMessage(message)) {
    return <ToolMessageBlock message={message} />;
  }

  return null;
};
