import { useRef } from 'react';
import { BiCopy } from 'react-icons/bi';
import { showInfoNotification } from 'utils/notifications';
import { v4 as uuidv4 } from 'uuid';
import { StyledTooltip } from '../common/StyledTooltip';

type Props = {
  content: string;
  className?: string;
};

export const CopyMessageButton = ({ content, className }: Props) => {
  const tooltipIdRef = useRef<string>(`copy-tooltip-${uuidv4()}`);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    showInfoNotification('Copied to clipboard');
  };

  return (
    <>
      <BiCopy
        data-tooltip-id={tooltipIdRef.current}
        data-tooltip-content="Copy to clipboard"
        onClick={copyToClipboard}
        className={`h-4 w-4 text-neutral-600 opacity-0 group-hover:opacity-100 cursor-pointer hover:text-neutral-300 transition-opacity focus:outline-none ${className}`}
      />
      <StyledTooltip id={tooltipIdRef.current} />
    </>
  );
};
