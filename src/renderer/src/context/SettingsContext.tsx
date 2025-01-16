import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SettingsData } from '@common/types';

type SettingsContextType = {
  settings: SettingsData | null;
  saveSettings: (settings: SettingsData) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettingsState] = useState<SettingsData | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const loadedSettings = await window.api.loadSettings();
      setSettingsState(loadedSettings);
    };
    void loadSettings();
  }, []);

  const saveSettings = async (updated: SettingsData) => {
    try {
      setSettingsState(updated);
      await window.api.saveSettings(updated);
    } catch (error) {
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
