import { ReactNode } from 'react';
import clsx from 'clsx';

type Props = {
  title: string;
  children: ReactNode;
  className?: string;
};

export const Section = ({ title, children, className }: Props) => {
  return (
    <div className={clsx('relative border border-neutral-700 rounded-md', className)}>
      <h2 className="absolute -top-3 left-4 px-2 bg-neutral-850 text-sm font-medium text-neutral-100">{title}</h2>
      {children}
    </div>
  );
};
