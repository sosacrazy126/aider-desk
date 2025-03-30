import { getActiveProvider, McpAgent, McpServerConfig, SettingsData } from '@common/types';
import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import {
  LlmProvider,
  PROVIDER_MODELS,
  AVAILABLE_PROVIDERS,
  isBedrockProvider,
  isOpenAiProvider,
  isAnthropicProvider,
  isGeminiProvider,
  isDeepseekProvider,
} from '@common/llm-providers';

import { McpServerForm } from './McpServerForm';
import { McpServerItem } from './McpServerItem';
import { OpenAiParameters, AnthropicParameters, GeminiParameters, BedrockParameters, DeepseekParameters } from './providers';

import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Slider } from '@/components/common/Slider';
import { InfoIcon } from '@/components/common/InfoIcon';
import { TextArea } from '@/components/common/TextArea';
import { Accordion } from '@/components/common/Accordion';
import { Input } from '@/components/common/Input';

type Props = {
  settings: SettingsData;
  setSettings: (settings: SettingsData) => void;
};

type EditingServer = {
  name: string;
  config: McpServerConfig;
};

export const McpSettings = ({ settings, setSettings }: Props) => {
  const { mcpAgent } = settings;
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [editingServer, setEditingServer] = useState<EditingServer | null>(null);
  const activeProvider = getActiveProvider(mcpAgent.providers);

  const handleProviderChanged = (newProviderName: string) => {
    let updatedProviders = settings.mcpAgent.providers;

    // Check if provider already exists
    const existingProvider = updatedProviders.find((provider) => provider.name === newProviderName);

    if (!existingProvider) {
      // Create new provider with default values based on provider type
      let newProvider: LlmProvider;

      if (newProviderName === 'bedrock') {
        newProvider = {
          name: 'bedrock',
          accessKeyId: '',
          secretAccessKey: '',
          region: 'us-east-1',
          model: Object.keys(PROVIDER_MODELS[newProviderName].models)[0],
          active: true,
        };
      } else {
        newProvider = {
          name: newProviderName,
          apiKey: '',
          model: Object.keys(PROVIDER_MODELS[newProviderName].models)[0],
          active: true,
        } as LlmProvider;
      }

      updatedProviders = [...updatedProviders, newProvider];
    }

    // Update active state for all providers
    updatedProviders = updatedProviders.map((provider) => ({
      ...provider,
      active: provider.name === newProviderName,
    }));

    const updatedMcpConfig = {
      ...settings.mcpAgent,
      providers: updatedProviders,
    };
    setSettings({ ...settings, mcpAgent: updatedMcpConfig });
  };

  const handleMaxIterationsChanged = (newMaxIterations: number) => {
    const updatedMcpConfig: McpAgent = {
      ...settings.mcpAgent,
      maxIterations: newMaxIterations,
    };
    setSettings({ ...settings, mcpAgent: updatedMcpConfig });
  };

  const handleDelayBetweenIterationsChanged = (newDelay: number) => {
    const updatedMcpConfig: McpAgent = {
      ...settings.mcpAgent,
      minTimeBetweenToolCalls: newDelay,
    };
    setSettings({ ...settings, mcpAgent: updatedMcpConfig });
  };

  const handleMaxTokenChanged = (newMaxTokens: number) => {
    const updatedMcpConfig: McpAgent = {
      ...settings.mcpAgent,
      maxTokens: newMaxTokens,
    };
    setSettings({ ...settings, mcpAgent: updatedMcpConfig });
  };

  const handleSystemPromptChanged = (newSystemPrompt: string) => {
    const updatedMcpConfig = {
      ...settings.mcpAgent,
      systemPrompt: newSystemPrompt,
    };
    setSettings({ ...settings, mcpAgent: updatedMcpConfig });
  };

  const handleServerConfigSave = (newServerName: string, newServerConfig: McpServerConfig) => {
    const updatedMcpServers = {
      ...settings.mcpAgent.mcpServers,
      [newServerName]: newServerConfig,
    };
    const updatedMcpConfig: McpAgent = {
      ...settings.mcpAgent,
      mcpServers: updatedMcpServers,
    };
    setSettings({ ...settings, mcpAgent: updatedMcpConfig });
    setIsAddingServer(false);
    setEditingServer(null);
  };

  const handleServerConfigRemove = (serverName: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [serverName]: removedServer, ...remainingServers } = settings.mcpAgent.mcpServers;
    const updatedMcpConfig = {
      ...settings.mcpAgent,
      mcpServers: remainingServers,
    };
    setSettings({ ...settings, mcpAgent: updatedMcpConfig });
  };

  return (
    <div>
      {isAddingServer || editingServer ? (
        <McpServerForm
          onSave={handleServerConfigSave}
          onCancel={() => {
            setIsAddingServer(false);
            setEditingServer(null);
          }}
          initialName={editingServer?.name}
          initialConfig={editingServer?.config}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div>
                <Select label="Provider" value={activeProvider?.name || ''} onChange={handleProviderChanged} options={AVAILABLE_PROVIDERS} />
              </div>

              {activeProvider && isOpenAiProvider(activeProvider) && <OpenAiParameters settings={settings} setSettings={setSettings} />}

              {activeProvider && isAnthropicProvider(activeProvider) && <AnthropicParameters settings={settings} setSettings={setSettings} />}

              {activeProvider && isGeminiProvider(activeProvider) && <GeminiParameters settings={settings} setSettings={setSettings} />}

              {activeProvider && isDeepseekProvider(activeProvider) && <DeepseekParameters settings={settings} setSettings={setSettings} />}

              {activeProvider && isBedrockProvider(activeProvider) && <BedrockParameters settings={settings} setSettings={setSettings} />}
            </div>
            <div>
              <div>
                <Slider
                  label={
                    <div className="flex items-center">
                      <span>Max Iterations</span>
                      <InfoIcon className="ml-1" tooltip="Maximum number of iterations for MCP tool calls. Helps control computational resources." />
                    </div>
                  }
                  min={1}
                  max={100}
                  value={mcpAgent.maxIterations}
                  onChange={handleMaxIterationsChanged}
                />
              </div>
              <div className="mt-4">
                <Input
                  label={
                    <div className="flex items-center">
                      <span>Min Time Between Tool Calls (ms)</span>
                      <InfoIcon
                        className="ml-1"
                        tooltip="Sets the minimum time between tool calls to prevent rate limiting (e.g., for Brave or other API-constrained services)."
                      />
                    </div>
                  }
                  type="number"
                  min={0}
                  max={10000}
                  step={100}
                  value={mcpAgent.minTimeBetweenToolCalls.toString()}
                  onChange={(e) => handleDelayBetweenIterationsChanged(Number(e.target.value))}
                />
              </div>
              <div className="mt-2">
                <Input
                  label={
                    <div className="flex items-center">
                      <span>Max Tokens</span>
                      <InfoIcon className="ml-1" tooltip="Maximum number of tokens the MCP agent can use per response." />
                    </div>
                  }
                  type="number"
                  min={1}
                  value={mcpAgent.maxTokens.toString()}
                  onChange={(e) => handleMaxTokenChanged(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Accordion title="System Prompt" className="text-sm">
              <div className="text-xxs text-amber-500 mb-2">
                Warning: Modifying the system prompt can cause the MCP agent to behave unexpectedly. Only change this if you understand the implications.
              </div>
              <TextArea value={mcpAgent.systemPrompt} onChange={(e) => handleSystemPromptChanged(e.target.value)} rows={20} className="w-full resize-none" />
            </Accordion>
          </div>
          <div className="mt-4">
            <div className="text-sm text-neutral-100 font-medium mb-2 mt-4">MCP Servers</div>
            {Object.keys(mcpAgent.mcpServers).length === 0 ? (
              <div className="text-xs text-gray-500 mb-2">No MCP servers configured.</div>
            ) : (
              Object.entries(mcpAgent.mcpServers).map(([serverName, config]) => (
                <McpServerItem
                  key={serverName}
                  serverName={serverName}
                  config={config}
                  onRemove={() => handleServerConfigRemove(serverName)}
                  onEdit={() => setEditingServer({ name: serverName, config })}
                />
              ))
            )}
            <div className="flex justify-center">
              <Button onClick={() => setIsAddingServer(true)} variant="text" className="mt-3 flex items-center text-sm">
                <FaPlus className="mr-2 w-2 h-2" /> Add server
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
