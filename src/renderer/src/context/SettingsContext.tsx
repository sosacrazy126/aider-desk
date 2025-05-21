import { SettingsData } from '@common/types';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type SettingsContextType = {
  settings: SettingsData | null;
  saveSettings: (settings: SettingsData) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SettingsData | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loadedSettings = await window.api.loadSettings();
        setSettings(loadedSettings);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load settings via IPC:', error);
        setSettings({
          language: 'en',
          startupMode: 'empty',
          zoomLevel: 1,
          notificationsEnabled: false,
          aiderDeskAutoUpdate: true,
          onboardingFinished: false,
          aider: { options: '', environmentVariables: '' },
          models: { preferred: [] },
          agentConfig: {
            providers: [],
            maxIterations: 10,
            maxTokens: 1000,
            minTimeBetweenToolCalls: 0,
            mcpServers: {},
            disabledServers: [],
            toolApprovals: {},
            includeContextFiles: false,
            includeRepoMap: false,
            usePowerTools: false,
            useAiderTools: true,
            customInstructions: '',
          }
        });
      }
    };
    void loadSettings();
  }, []);

  const saveSettings = async (updated: SettingsData) => {
    try {
      setSettings(updated);
      const updatedSettings = await window.api.saveSettings(updated);
      setSettings(updatedSettings);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save settings:', error);
    }
  };

  return <SettingsContext.Provider value={{ settings, saveSettings }}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
