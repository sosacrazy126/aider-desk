import { useState, useEffect } from 'react';
import { Settings } from 'pages/Settings';
import { useSettings } from 'context/SettingsContext';
import { SettingsData } from '@common/types';
import { ConfirmDialog } from './ConfirmDialog';

type Props = {
  onClose: () => void;
};

export const SettingsDialog = ({ onClose }: Props) => {
  const { settings: originalSettings, saveSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<SettingsData | null>(null);

  useEffect(() => {
    if (originalSettings) {
      setLocalSettings(originalSettings);
    }
  }, [originalSettings]);

  const handleSave = async () => {
    if (localSettings) {
      await saveSettings(localSettings);
      onClose();
    }
  };

  return (
    <ConfirmDialog
      title="SETTINGS"
      onCancel={onClose}
      onConfirm={handleSave}
      confirmButtonText="Save"
      width={800}
      closeOnEscape
      confirmButtonClass="bg-amber-600 hover:bg-amber-500"
      disabled={false}
    >
      {localSettings && <Settings settings={localSettings} updateSettings={setLocalSettings} />}
    </ConfirmDialog>
  );
};
