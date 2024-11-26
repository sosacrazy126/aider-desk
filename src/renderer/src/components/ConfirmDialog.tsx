import { ReactNode } from 'react';
import { BaseDialog } from './BaseDialog';

type Props = {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
  children: ReactNode;
  disabled?: boolean;
  confirmButtonClass?: string;
  width?: number;
};

export const ConfirmDialog = ({
  title,
  onConfirm,
  onCancel,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  children,
  disabled = false,
  confirmButtonClass = 'bg-amber-600 hover:bg-amber-500',
  width,
}: Props) => {
  return (
    <BaseDialog
      title={title}
      onClose={onCancel}
      width={width}
      footer={
        <>
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-700/50 transition-colors">
            {cancelButtonText}
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              disabled ? 'bg-neutral-700/50 text-neutral-500 cursor-not-allowed' : `${confirmButtonClass} text-white shadow-lg shadow-amber-900/20`
            }`}
          >
            {confirmButtonText}
          </button>
        </>
      }
    >
      {children}
    </BaseDialog>
  );
};
