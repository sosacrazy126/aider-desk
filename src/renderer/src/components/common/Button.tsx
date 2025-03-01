import { ReactNode } from 'react';

type ButtonVariant = 'contained' | 'text' | 'outline';

type Props = {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  contained: 'bg-amber-600 hover:bg-amber-500 text-white',
  text: 'bg-transparent hover:bg-neutral-700/50 hover:text-amber-300',
  outline: 'border border-amber-600 text-amber-600 hover:bg-amber-600/10',
};

export const Button = ({ children, onClick, variant = 'contained', className = '', disabled = false, autoFocus = false }: Props) => {
  const baseClasses = disabled
    ? 'bg-neutral-700/50 text-neutral-500 cursor-not-allowed hover:bg-neutral-700/50 hover:text-neutral-500'
    : variantClasses[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      autoFocus={autoFocus}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${baseClasses} ${className}`}
    >
      {children}
    </button>
  );
};
