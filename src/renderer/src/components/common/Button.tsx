import { ReactNode } from 'react';

type ButtonVariant = 'contained' | 'text' | 'outline';
type ButtonColor = 'primary' | 'secondary';

type Props = {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  color?: ButtonColor;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
};

const colorClasses: Record<ButtonColor, Record<ButtonVariant, string>> = {
  primary: {
    contained: 'bg-amber-600 hover:bg-amber-500 text-white',
    text: 'text-amber-600 hover:bg-amber-600/10',
    outline: 'border-amber-600 text-amber-600 hover:bg-amber-600/10',
  },
  secondary: {
    contained: 'bg-blue-600 hover:bg-blue-500 text-white',
    text: 'text-blue-600 hover:bg-blue-600/10',
    outline: 'border-blue-600 text-blue-600 hover:bg-blue-600/10',
  },
};

export const Button = ({ children, onClick, variant = 'contained', color = 'primary', className = '', disabled = false, autoFocus = false }: Props) => {
  const baseColorClasses = disabled
    ? 'bg-neutral-700/50 text-neutral-500 cursor-not-allowed hover:bg-neutral-700/50 hover:text-neutral-500'
    : colorClasses[color][variant];

  const borderClass = variant === 'outline' && !disabled ? 'border' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      autoFocus={autoFocus}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${borderClass} ${baseColorClasses} ${className}`}
    >
      {children}
    </button>
  );
};
