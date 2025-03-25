import { ChangeEvent } from 'react';
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
      <Input label="Region" value={region} onChange={handleRegionChange} placeholder="e.g., us-east-1" />
      <Input
        label={
          <div className="flex items-center">
            <span>Access Key ID</span>
            <InfoIcon className="ml-1" tooltip="AWS access key ID. Can be left empty if AWS_PROFILE is set in environment." />
          </div>
        }
        value={accessKeyId}
        onChange={handleAccessKeyIdChange}
      />
      <Input
        label={
          <div className="flex items-center">
            <span>Secret Access Key</span>
            <InfoIcon className="ml-1" tooltip="AWS secret access key. Can be left empty if AWS_PROFILE is set in environment." />
          </div>
        }
        type="password"
        value={secretAccessKey}
        onChange={handleSecretAccessKeyChange}
      />
    </div>
  );
};
