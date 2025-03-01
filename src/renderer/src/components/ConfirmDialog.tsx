import { ReactNode } from 'react';

import { BaseDialog } from './BaseDialog';
import { Button } from './common/Button';

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
  closeOnEscape?: boolean;
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
  closeOnEscape = false,
}: Props) => {
  return (
    <BaseDialog
      title={title}
      onClose={onCancel}
      width={width}
      footer={
        <>
          <Button onClick={onCancel} variant="text">
            {cancelButtonText}
          </Button>
          <Button onClick={onConfirm} autoFocus={true} disabled={disabled} variant="contained" className={confirmButtonClass}>
            {confirmButtonText}
          </Button>
        </>
      }
      closeOnEscape={closeOnEscape}
    >
      {children}
    </BaseDialog>
  );
};
