import { useEffect, useState } from 'react';
import { SettingsData, StartupMode } from '@common/types';

import { RadioButton } from '../common/RadioButton';
import Select, { Option } from '../common/Select';

type Props = {
  settings: SettingsData;
  setSettings: (settings: SettingsData) => void;
};

export const GeneralSettings = ({ settings, setSettings }: Props) => {
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

    loadSessions();
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

  const handleRadioClick = (value: string) => {
    handleStartupModeChange(value as StartupMode);
  };

  return (
    <div className="space-y-6 min-h-[300px]">
      <div className="relative border border-neutral-700 rounded-md pt-2 mt-4">
        <h2 className="absolute -top-3 left-4 px-2 bg-neutral-850 text-sm font-medium text-neutral-100">Start Up</h2>
        <div className="px-4 py-3 space-y-3">
          <RadioButton
            id="startup-empty"
            name="startup-mode"
            value={StartupMode.Empty}
            checked={settings.startupMode === StartupMode.Empty}
            onChange={handleRadioClick}
            label="Start with empty session"
          />

          <RadioButton
            id="startup-last"
            name="startup-mode"
            value={StartupMode.Last}
            checked={settings.startupMode === StartupMode.Last}
            onChange={handleRadioClick}
            label="Load last session"
          />

          <div className="flex flex-col space-y-2">
            <RadioButton
              id="startup-specific"
              name="startup-mode"
              value={StartupMode.Specific}
              checked={settings.startupMode === StartupMode.Specific}
              onChange={handleRadioClick}
              label="Load specific session"
            />

            {settings.startupMode === StartupMode.Specific && (
              <div className="ml-6">
                <Select
                  value={settings.startupSessionName || ''}
                  onChange={handleSessionChange}
                  options={
                    loading
                      ? [{ label: 'Loading sessions...', value: '' }]
                      : sessions.length === 0
                        ? [{ label: 'No saved sessions', value: '' }]
                        : [{ label: 'Select a session', value: '' }, ...sessions]
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
