import { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsData } from '@common/types';
import { isOpenRouterProvider } from '@common/llm-providers';

import { Input } from '@/components/common/Input';

type Props = {
  settings: SettingsData;
  setSettings: (settings: SettingsData) => void;
};

export const OpenRouterParameters = ({ settings, setSettings }: Props) => {
  const { t } = useTranslation();
  const activeProvider = settings.agentConfig.providers.find((provider) => isOpenRouterProvider(provider));

  const apiKey = activeProvider?.apiKey || '';
  const model = activeProvider?.model || '';

  const handleApiKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
    const updatedProviders = settings.agentConfig.providers.map((provider) =>
      provider.active && isOpenRouterProvider(provider) ? { ...provider, apiKey: e.target.value } : provider,
    );

    const updatedAgentConfig = {
      ...settings.agentConfig,
      providers: updatedProviders,
    };
    setSettings({ ...settings, agentConfig: updatedAgentConfig });
  };

  const handleModelChange = (selectedModel: string) => {
    const updatedProviders = settings.agentConfig.providers.map((provider) =>
      provider.active && isOpenRouterProvider(provider) ? { ...provider, model: selectedModel } : provider,
    );

    const updatedAgentConfig = {
      ...settings.agentConfig,
      providers: updatedProviders,
    };
    setSettings({ ...settings, agentConfig: updatedAgentConfig });
  };

  return (
    <div className="mt-2 space-y-2">
      <Input
        label={t('model.label')}
        type="text"
        value={model}
        onChange={(e) => handleModelChange(e.target.value)}
        placeholder={t('openrouter.modelPlaceholder')}
      />
      <Input
        label={t('openrouter.apiKey')}
        type="password"
        value={apiKey}
        onChange={handleApiKeyChange}
        placeholder={t('settings.agent.envVarPlaceholder', { envVar: 'OPENROUTER_API_KEY' })}
      />
    </div>
  );
};
