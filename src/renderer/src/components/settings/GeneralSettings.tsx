import { useTranslation } from 'react-i18next';
import { SettingsData, StartupMode } from '@common/types';

import { RadioButton } from '../common/RadioButton';

import { LanguageSelector } from './LanguageSelector';

type Props = {
  settings: SettingsData;
  setSettings: (settings: SettingsData) => void;
  onLanguageChange: (language: string) => void;
};

export const GeneralSettings = ({ settings, setSettings, onLanguageChange }: Props) => {
  const { t } = useTranslation();

  const handleStartupModeChange = (mode: StartupMode) => {
    setSettings({
      ...settings,
      startupMode: mode,
    });
  };

  const handleStartupModeClick = (value: string) => {
    handleStartupModeChange(value as StartupMode);
  };

  return (
    <div className="space-y-8 min-h-[300px]">
      <LanguageSelector language={settings.language} onChange={onLanguageChange} />
      <div className="relative border border-neutral-700 rounded-md pt-2 mt-4">
        <h2 className="absolute -top-3 left-4 px-2 bg-neutral-850 text-sm font-medium text-neutral-100">{t('settings.startup.title')}</h2>
        <div className="px-4 py-3 space-y-3">
          <RadioButton
            id="startup-empty"
            name="startup-mode"
            value={StartupMode.Empty}
            checked={settings.startupMode === StartupMode.Empty}
            onChange={handleStartupModeClick}
            label={t('settings.startup.emptySession')}
          />

          <RadioButton
            id="startup-last"
            name="startup-mode"
            value={StartupMode.Last}
            checked={settings.startupMode === StartupMode.Last}
            onChange={handleStartupModeClick}
            label={t('settings.startup.lastSession')}
          />
        </div>
      </div>
    </div>
  );
};
