import { BiCopy } from 'react-icons/bi';
import { Tooltip } from 'react-tooltip';
import { showInfoNotification } from 'utils/notifications';

type Props = {
  content: string;
  className?: string;
};

export const CopyMessageButton = ({ content, className }: Props) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    showInfoNotification('Copied to clipboard');
  };

  return (
    <>
      <BiCopy
        data-tooltip-id="copy-tooltip"
        data-tooltip-content="Copy to clipboard"
        onClick={copyToClipboard}
        className={`h-4 w-4 text-neutral-600 opacity-0 group-hover:opacity-100 cursor-pointer hover:text-neutral-300 transition-opacity focus:outline-none ${className}`}
      />
      <Tooltip id="copy-tooltip" />
    </>
  );
};
