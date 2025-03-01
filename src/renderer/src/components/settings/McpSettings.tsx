import { McpConfig, McpServerConfig, SettingsData } from '@common/types';
import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';

import { McpServerForm } from './McpServerForm';
import { McpServerItem } from './McpServerItem';

import { Select } from '@/components/common/Select';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Slider } from '@/components/common/Slider';
import { InfoIcon } from '@/components/common/InfoIcon';

type Props = {
  settings: SettingsData;
  setSettings: (settings: SettingsData) => void;
};

type EditingServer = {
  name: string;
  config: McpServerConfig;
};

export const McpSettings = ({ settings, setSettings }: Props) => {
  const { mcpConfig } = settings;
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [editingServer, setEditingServer] = useState<EditingServer | null>(null);

  const handleApiKeyChanged = (newApiKey: string) => {
    const updatedMcpConfig = { ...settings.mcpConfig };

    if (mcpConfig.provider === 'openai') {
      updatedMcpConfig.openAiApiKey = newApiKey;
    } else {
      updatedMcpConfig.anthropicApiKey = newApiKey;
    }
    setSettings({ ...settings, mcpConfig: updatedMcpConfig });
  };

  const handleProviderChanged = (newProvider: 'openai' | 'anthropic') => {
    const updatedMcpConfig: McpConfig = {
      ...settings.mcpConfig,
      provider: newProvider,
    };
    setSettings({ ...settings, mcpConfig: updatedMcpConfig });
  };

  const handleMaxIterationsChanged = (newMaxIterations: number) => {
    const updatedMcpConfig: McpConfig = {
      ...settings.mcpConfig,
      maxIterations: newMaxIterations,
    };
    setSettings({ ...settings, mcpConfig: updatedMcpConfig });
  };

  const handleDelayBetweenIterationsChanged = (newDelay: number) => {
    const updatedMcpConfig: McpConfig = {
      ...settings.mcpConfig,
      minTimeBetweenToolCalls: newDelay,
    };
    setSettings({ ...settings, mcpConfig: updatedMcpConfig });
  };

  const handleServerConfigSave = (newServerName: string, newServerConfig: McpServerConfig) => {
    const updatedMcpServers = {
      ...settings.mcpConfig.mcpServers,
      [newServerName]: newServerConfig,
    };
    const updatedMcpConfig: McpConfig = {
      ...settings.mcpConfig,
      mcpServers: updatedMcpServers,
    };
    setSettings({ ...settings, mcpConfig: updatedMcpConfig });
    setIsAddingServer(false);
    setEditingServer(null);
  };

  const handleServerConfigRemove = (serverName: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [serverName]: removedServer, ...remainingServers } = settings.mcpConfig.mcpServers;
    const updatedMcpConfig = {
      ...settings.mcpConfig,
      mcpServers: remainingServers,
    };
    setSettings({ ...settings, mcpConfig: updatedMcpConfig });
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
          <div>
            <Select
              label="Provider"
              value={mcpConfig.provider}
              onChange={(value) => handleProviderChanged(value as 'openai' | 'anthropic')}
              options={[
                { value: 'openai', label: 'OpenAI' },
                { value: 'anthropic', label: 'Anthropic' },
              ]}
            />
          </div>
          <div className="mt-2">
            <Input
              label="API Key"
              type="password"
              value={mcpConfig.provider === 'openai' ? mcpConfig.openAiApiKey : mcpConfig.anthropicApiKey}
              onChange={(e) => handleApiKeyChanged(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mt-4 flex space-x-8">
            <div className="flex-1">
              <Slider
                label={
                  <div className="flex items-center">
                    <span>Max Iterations</span>
                    <InfoIcon className="ml-1" tooltip="Maximum number of iterations for MCP tool calls. Helps control computational resources." />
                  </div>
                }
                min={1}
                max={20}
                value={mcpConfig.maxIterations}
                onChange={handleMaxIterationsChanged}
              />
            </div>
            <div className="flex-1">
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
                value={mcpConfig.minTimeBetweenToolCalls.toString()}
                onChange={(e) => handleDelayBetweenIterationsChanged(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">MCP Servers</h3>
            {Object.keys(mcpConfig.mcpServers).length === 0 ? (
              <div className="text-xs text-gray-500 mb-2">No MCP servers configured.</div>
            ) : (
              Object.entries(mcpConfig.mcpServers).map(([serverName, config]) => (
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
              <Button onClick={() => setIsAddingServer(true)} variant="text" className="mt-3 flex items-center">
                <FaPlus className="mr-2" /> Add server
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
