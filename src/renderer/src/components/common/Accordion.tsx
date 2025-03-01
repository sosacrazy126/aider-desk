import { ReactNode, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';

type Props = {
  title: ReactNode;
  children: ReactNode;
  className?: string;
  buttonClassName?: string;
  defaultOpen?: boolean;
};

export const Accordion = ({ title, children, className, buttonClassName = '', defaultOpen = false }: Props) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 p-2 rounded hover:bg-neutral-700/50 transition-colors ${buttonClassName}`}
      >
        <FaChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
        {title}
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>{children}</div>
    </div>
  );
};
