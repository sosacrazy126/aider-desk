import { useState, useEffect } from 'react';
import { SettingsData } from '../../../common/types';

export const useSettings = () => {
  const [settings, setSettings] = useState<SettingsData>({
    aider: {
      options: '',
      environmentVariables: '',
    },
    models: {
      preferred: [],
    },
  });

  useEffect(() => {
    const loadSettings = async () => {
      const loadedSettings = await window.api.loadSettings();
      setSettings(loadedSettings);
    };
    void loadSettings();
  }, []);

  const saveSettings = async (updatedSettings?: SettingsData) => {
    await window.api.saveSettings(updatedSettings || settings);
  };

  return { settings, setSettings, saveSettings };
};
