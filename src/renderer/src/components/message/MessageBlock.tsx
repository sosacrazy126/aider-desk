import { useTranslation } from 'react-i18next';

import { CommandOutputMessageBlock } from './CommandOutputMessageBlock';
import { LoadingMessageBlock } from './LoadingMessageBlock';
import { LogMessageBlock } from './LogMessageBlock';
import { UserMessageBlock } from './UserMessageBlock';
import { ReflectedMessageBlock } from './ReflectedMessageBlock';
import { ResponseMessageBlock } from './ResponseMessageBlock';

import {
  isCommandOutputMessage,
  isLogMessage,
  isLoadingMessage,
  isUserMessage,
  isReflectedMessage,
  isResponseMessage,
  Message,
  isToolMessage,
  LogMessage,
} from '@/types/message';
import { ToolMessageBlock } from '@/components/message/ToolMessageBlock';

type Props = {
  baseDir: string;
  message: Message;
  allFiles: string[];
  renderMarkdown: boolean;
  remove?: () => void;
  redo?: () => void;
  edit?: (content: string) => void;
};

export const MessageBlock = ({ baseDir, message, allFiles, renderMarkdown, remove, redo, edit }: Props) => {
  const { t } = useTranslation();

  if (isLoadingMessage(message)) {
    return <LoadingMessageBlock message={message} />;
  }

  if (isLogMessage(message)) {
    return <LogMessageBlock message={message} onRemove={remove} />;
  }

  if (isReflectedMessage(message)) {
    return <ReflectedMessageBlock baseDir={baseDir} message={message} allFiles={allFiles} />;
  }

  if (isCommandOutputMessage(message)) {
    return <CommandOutputMessageBlock message={message} />;
  }

  if (isUserMessage(message)) {
    return (
      <UserMessageBlock baseDir={baseDir} message={message} allFiles={allFiles} renderMarkdown={renderMarkdown} onRemove={remove} onRedo={redo} onEdit={edit} />
    );
  }

  if (isResponseMessage(message)) {
    return <ResponseMessageBlock baseDir={baseDir} message={message} allFiles={allFiles} renderMarkdown={renderMarkdown} onRemove={remove} />;
  }

  if (isToolMessage(message)) {
    if (message.serverName === 'helpers') {
      let logMessageContent = message.content;

      if (message.toolName === 'no_such_tool') {
        logMessageContent = t('toolMessage.errors.noSuchTool', { toolName: message.args.toolName });
      } else if (message.toolName === 'invalid_tool_arguments') {
        logMessageContent = t('toolMessage.errors.invalidToolArguments', {
          toolName: message.args.toolName,
        });
      }

      const logMessage: LogMessage = {
        type: 'log',
        level: 'info',
        id: message.id,
        content: logMessageContent,
      };
      return <LogMessageBlock message={logMessage} onRemove={remove} />;
    }
    return <ToolMessageBlock message={message} onRemove={remove} />;
  }

  return null;
};
