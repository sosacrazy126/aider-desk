import { ChangeEvent } from 'react';
import { SettingsData } from '@common/types';
import { OpenAiCompatibleProvider, isOpenAiCompatibleProvider } from '@common/llm-providers';

import { Input } from '@/components/common/Input';

type Props = {
  settings: SettingsData;
  setSettings: (settings: SettingsData) => void;
};

export const OpenAiCompatibleParameters = ({ settings, setSettings }: Props) => {
  const activeProvider = settings.mcpAgent.providers.find((provider) => provider.active && isOpenAiCompatibleProvider(provider)) as
    | OpenAiCompatibleProvider
    | undefined;

  const baseUrl = activeProvider?.baseUrl || '';
  const apiKey = activeProvider?.apiKey || '';
  const model = activeProvider?.model || '';

  const handleBaseUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    const updatedProviders = settings.mcpAgent.providers.map((provider) =>
      provider.active && isOpenAiCompatibleProvider(provider) ? { ...provider, baseUrl: e.target.value } : provider,
    );

    const updatedMcpConfig = {
      ...settings.mcpAgent,
      providers: updatedProviders,
    };
    setSettings({ ...settings, mcpAgent: updatedMcpConfig });
  };

  const handleApiKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
    const updatedProviders = settings.mcpAgent.providers.map((provider) =>
      provider.active && isOpenAiCompatibleProvider(provider) ? { ...provider, apiKey: e.target.value } : provider,
    );

    const updatedMcpConfig = {
      ...settings.mcpAgent,
      providers: updatedProviders,
    };
    setSettings({ ...settings, mcpAgent: updatedMcpConfig });
  };

  const handleModelChange = (selectedModel: string) => {
    const updatedProviders = settings.mcpAgent.providers.map((provider) =>
      provider.active && isOpenAiCompatibleProvider(provider) ? { ...provider, model: selectedModel } : provider,
    );

    const updatedMcpConfig = {
      ...settings.mcpAgent,
      providers: updatedProviders,
    };
    setSettings({ ...settings, mcpAgent: updatedMcpConfig });
  };

  return (
    <div className="mt-2 space-y-2">
      <Input label="Base URL" type="text" value={baseUrl} onChange={handleBaseUrlChange} placeholder="e.g., http://localhost:8080/v1" />
      <Input label="Model Name" type="text" value={model} onChange={(e) => handleModelChange(e.target.value)} placeholder="Enter model name" />
      <Input label="API Key" type="password" value={apiKey} onChange={handleApiKeyChange} />
    </div>
  );
};
