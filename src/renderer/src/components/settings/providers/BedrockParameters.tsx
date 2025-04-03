import { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsData } from '@common/types';
import { BedrockProvider, isBedrockProvider } from '@common/llm-providers';

import { ModelSelect } from './ModelSelect';

import { Input } from '@/components/common/Input';
import { InfoIcon } from '@/components/common/InfoIcon';

type Props = {
  settings: SettingsData;
  setSettings: (settings: SettingsData) => void;
};

export const BedrockParameters = ({ settings, setSettings }: Props) => {
  const { t } = useTranslation();

  const activeProvider = settings.mcpAgent.providers.find((provider) => provider.active && isBedrockProvider(provider)) as BedrockProvider | undefined;

  const region = activeProvider?.region || '';
  const accessKeyId = activeProvider?.accessKeyId;
  const secretAccessKey = activeProvider?.secretAccessKey;
  const model = activeProvider?.model || '';

  const handleRegionChange = (e: ChangeEvent<HTMLInputElement>) => {
    const updatedProviders = settings.mcpAgent.providers.map((provider) =>
      provider.active && isBedrockProvider(provider) ? { ...provider, region: e.target.value } : provider,
    );

    const updatedMcpConfig = {
      ...settings.mcpAgent,
      providers: updatedProviders,
    };
    setSettings({ ...settings, mcpAgent: updatedMcpConfig });
  };

  const handleAccessKeyIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    const updatedProviders = settings.mcpAgent.providers.map((provider) =>
      provider.active && isBedrockProvider(provider) ? { ...provider, accessKeyId: e.target.value } : provider,
    );

    const updatedMcpConfig = {
      ...settings.mcpAgent,
      providers: updatedProviders,
    };
    setSettings({ ...settings, mcpAgent: updatedMcpConfig });
  };

  const handleSecretAccessKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
    const updatedProviders = settings.mcpAgent.providers.map((provider) =>
      provider.active && isBedrockProvider(provider) ? { ...provider, secretAccessKey: e.target.value } : provider,
    );

    const updatedMcpConfig = {
      ...settings.mcpAgent,
      providers: updatedProviders,
    };
    setSettings({ ...settings, mcpAgent: updatedMcpConfig });
  };

  const handleModelChange = (selectedModel: string) => {
    const updatedProviders = settings.mcpAgent.providers.map((provider) =>
      provider.active && isBedrockProvider(provider) ? { ...provider, model: selectedModel } : provider,
    );

    const updatedMcpConfig = {
      ...settings.mcpAgent,
      providers: updatedProviders,
    };
    setSettings({ ...settings, mcpAgent: updatedMcpConfig });
  };

  return (
    <div className="mt-2 space-y-2">
      <ModelSelect providerName="bedrock" currentModel={model} onChange={handleModelChange} />
      <Input label={t('bedrock.region')} value={region} onChange={handleRegionChange} placeholder={t('bedrock.regionPlaceholder')} />
      <Input
        label={
          <div className="flex items-center">
            <span>{t('bedrock.accessKeyId')}</span>
            <InfoIcon className="ml-1" tooltip={t('bedrock.accessKeyIdTooltip')} />
          </div>
        }
        value={accessKeyId}
        onChange={handleAccessKeyIdChange}
      />
      <Input
        label={
          <div className="flex items-center">
            <span>{t('bedrock.secretAccessKey')}</span>
            <InfoIcon className="ml-1" tooltip={t('bedrock.secretAccessKeyTooltip')} />
          </div>
        }
        type="password"
        value={secretAccessKey}
        onChange={handleSecretAccessKeyChange}
      />
    </div>
  );
};
