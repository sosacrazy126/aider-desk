import { FaInfoCircle } from 'react-icons/fa';

import { IconButton } from './IconButton';

type Props = {
  tooltip: string;
  className?: string;
};

export const InfoIcon = ({ tooltip, className }: Props) => {
  return <IconButton icon={<FaInfoCircle />} tooltip={tooltip} className={`ml-2 text-neutral-500 ${className || ''}`} onClick={() => {}} />;
};
