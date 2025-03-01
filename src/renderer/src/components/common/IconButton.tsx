import { ReactNode, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { StyledTooltip } from './StyledTooltip';

type Props = {
  icon: ReactNode;
  onClick: () => void;
  tooltip?: string;
  className?: string;
};

export const IconButton = ({ icon, onClick, tooltip, className }: Props) => {
  const tooltipIdRef = useRef<string>(`icon-button-tooltip-${uuidv4()}`);

  const baseClasses = 'text-neutral-500 cursor-pointer hover:text-neutral-300 transition-opacity focus:outline-none';
  const combinedClassName = `${baseClasses} ${className || ''}`;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onClick();
  };

  const renderButton = () => (
    <div onClick={handleClick} data-tooltip-id={tooltip ? tooltipIdRef.current : undefined} data-tooltip-content={tooltip} className={combinedClassName}>
      {icon}
    </div>
  );

  return (
    <>
      {renderButton()}
      {tooltip && <StyledTooltip id={tooltipIdRef.current} />}
    </>
  );
};
