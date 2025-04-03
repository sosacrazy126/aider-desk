import { SettingsData } from '@common/types';
import { useState, useEffect, useMemo } from 'react';
import { isEqual } from 'lodash';
import { useTranslation } from 'react-i18next';

import { Settings } from '@/pages/Settings';
import { useSettings } from '@/context/SettingsContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type Props = {
  onClose: () => void;
  initialTab?: number;
};

export const SettingsDialog = ({ onClose, initialTab = 0 }: Props) => {
  const { t, i18n } = useTranslation();

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

  const handleCancel = () => {
    if (originalSettings && localSettings?.language !== originalSettings.language) {
      void i18n.changeLanguage(originalSettings.language);
    }
    onClose();
  };

  const handleSave = async () => {
    if (localSettings) {
      await saveSettings(localSettings);
      onClose();
    }
  };

  const handleLanguageChange = (language: string) => {
    if (localSettings) {
      setLocalSettings({
        ...localSettings,
        language,
      });

      void i18n.changeLanguage(language);
    }
  };

  return (
    <ConfirmDialog
      title={t('settings.title')}
      onCancel={handleCancel}
      onConfirm={handleSave}
      confirmButtonText={t('common.save')}
      width={800}
      closeOnEscape
      disabled={!hasChanges}
    >
      {localSettings && <Settings settings={localSettings} updateSettings={setLocalSettings} onLanguageChange={handleLanguageChange} initialTab={initialTab} />}
    </ConfirmDialog>
  );
};
