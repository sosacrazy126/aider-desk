import { toast } from 'react-toastify';
import type { ToastOptions } from 'react-toastify';

const NOTIFICATION_OPTIONS: ToastOptions = {
  position: 'bottom-right',
  autoClose: 3000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: 'dark',
  progressStyle: {
    backgroundColor: '#333652', // neutral-700 from tailwind.config.js
    color: '#333652',
  },
  style: {
    backgroundColor: '#222431',
    color: '#f1f3f5',
    border: '1px solid #343a40',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
  },
  icon: false,
};

export const showSuccessNotification = (message: string) => {
  toast.success(message, {
    ...NOTIFICATION_OPTIONS,
    style: {
      ...NOTIFICATION_OPTIONS.style,
      color: '#e9ecef',
    },
  });
};

export const showErrorNotification = (message: string) => {
  toast.error(message, {
    ...NOTIFICATION_OPTIONS,
    style: {
      ...NOTIFICATION_OPTIONS.style,
      color: '#dd7171',
    },
  });
};

export const showInfoNotification = (message: string) => {
  toast.info(message, {
    ...NOTIFICATION_OPTIONS,
    style: {
      ...NOTIFICATION_OPTIONS.style,
      color: '#dee2e6',
    },
  });
};

export const showWarningNotification = (message: string) => {
  toast.warn(message, {
    ...NOTIFICATION_OPTIONS,
    style: {
      ...NOTIFICATION_OPTIONS.style,
      backgroundColor: '#212529',
      color: '#fed7aa',
    },
  });
};
