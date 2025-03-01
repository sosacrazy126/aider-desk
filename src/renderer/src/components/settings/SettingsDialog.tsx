import { SettingsData } from '@common/types';
import { useState, useEffect, useMemo } from 'react';
import { isEqual } from 'lodash';

import { Settings } from '@/pages/Settings';
import { useSettings } from '@/context/SettingsContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type Props = {
  onClose: () => void;
  initialTab?: number;
};

export const SettingsDialog = ({ onClose, initialTab = 0 }: Props) => {
  const { settings: originalSettings, saveSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<SettingsData | null>(null);

  useEffect(() => {
    if (originalSettings) {
      setLocalSettings(originalSettings);
    }
  }, [originalSettings]);

  const hasChanges = useMemo(() => {
    return localSettings && originalSettings && !isEqual(localSettings, originalSettings);
  }, [localSettings, originalSettings]);

  const handleSave = async () => {
    if (localSettings) {
      await saveSettings(localSettings);
      onClose();
    }
  };

  return (
    <ConfirmDialog title="SETTINGS" onCancel={onClose} onConfirm={handleSave} confirmButtonText="Save" width={800} closeOnEscape disabled={!hasChanges}>
      {localSettings && <Settings settings={localSettings} updateSettings={setLocalSettings} initialTab={initialTab} />}
    </ConfirmDialog>
  );
};
