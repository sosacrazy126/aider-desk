import { FaInfoCircle, FaExclamationTriangle, FaExclamationCircle } from 'react-icons/fa';

import { CopyMessageButton } from './CopyMessageButton';

import { LogMessage } from '@/types/message';

type Props = {
  message: LogMessage;
};

export const LogMessageBlock = ({ message }: Props) => {
  const baseClasses = 'rounded-md p-3 mb-2 max-w-full break-words whitespace-pre-wrap text-xs border';

  const levelConfig = {
    info: {
      levelClasses: 'bg-neutral-800 border-neutral-700/50 text-neutral-300',
      tooltipClass: 'text-neutral-500 hover:text-neutral-400',
      Icon: FaInfoCircle,
    },
    warning: {
      levelClasses: 'bg-yellow-900/30 border-yellow-800/50 text-yellow-200',
      tooltipClass: 'text-yellow-600 hover:text-yellow-300',
      Icon: FaExclamationTriangle,
    },
    error: {
      levelClasses: 'bg-red-900/30 border-red-800/50 text-red-200',
      tooltipClass: 'text-red-600 hover:text-red-300',
      Icon: FaExclamationCircle,
    },
  };

  const config = levelConfig[message.level] || levelConfig.info;
  const Icon = config.Icon;

  return (
    <div className={`${baseClasses} ${config.levelClasses} relative group`}>
      <div className="flex items-start gap-3">
        <Icon className="inline-block h-3 w-3 flex-shrink-0 mt-[3px]" />
        <div>{message.content}</div>
      </div>
      <div className="absolute top-2 right-2">
        <CopyMessageButton content={message.content} className={config.tooltipClass} />
      </div>
    </div>
  );
};
