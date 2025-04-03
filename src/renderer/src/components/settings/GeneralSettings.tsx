import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsData, StartupMode } from '@common/types';

import { RadioButton } from '../common/RadioButton';
import Select, { Option } from '../common/Select';

import { LanguageSelector } from './LanguageSelector';

type Props = {
  settings: SettingsData;
  setSettings: (settings: SettingsData) => void;
  onLanguageChange: (language: string) => void;
};

export const GeneralSettings = ({ settings, setSettings, onLanguageChange }: Props) => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        // Get the active project's baseDir
        const projects = await window.api.getOpenProjects();
        const activeProject = projects.find((p) => p.active);

        if (activeProject) {
          const sessionsList = await window.api.listSessions(activeProject.baseDir);
          setSessions(sessionsList.map((s) => ({ label: s.name, value: s.name })));
        }
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadSessions();
  }, []);

  const handleStartupModeChange = (mode: StartupMode) => {
    setSettings({
      ...settings,
      startupMode: mode,
    });
  };

  const handleSessionChange = (value: string) => {
    setSettings({
      ...settings,
      startupSessionName: value,
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

          <div className="flex flex-col space-y-2">
            <RadioButton
              id="startup-specific"
              name="startup-mode"
              value={StartupMode.Specific}
              checked={settings.startupMode === StartupMode.Specific}
              onChange={handleStartupModeClick}
              label={t('settings.startup.specificSession')}
            />

            {settings.startupMode === StartupMode.Specific && (
              <div className="ml-6">
                <Select
                  value={settings.startupSessionName || ''}
                  onChange={handleSessionChange}
                  options={
                    loading
                      ? [{ label: t('select.loadingSessions'), value: '' }]
                      : sessions.length === 0
                        ? [{ label: t('sessions.empty'), value: '' }]
                        : [{ label: t('select.placeholder'), value: '' }, ...sessions]
                  }
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
