import { ReactNode } from 'react';

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
};

export const BaseDialog = ({ title, onClose, children, footer, width = 384 }: Props) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div style={{ width: `${width}px` }} className="bg-neutral-800/95 shadow-2xl rounded-xl border border-neutral-700/50">
        <div className="px-6 py-4 border-b border-neutral-700/50">
          <h2 className="text-lg font-medium text-neutral-100">{title}</h2>
        </div>
        <div className="p-6">{children}</div>
        <div className="px-6 py-4 border-t border-neutral-700/50 flex justify-end space-x-3">
          {footer || (
            <button onClick={onClose} className="bg-neutral-600 text-neutral-100 px-4 py-2 rounded hover:bg-neutral-500">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
