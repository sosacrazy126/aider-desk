import { useRef, useState } from 'react';
import { MdKeyboardArrowUp, MdSettings } from 'react-icons/md';
import { SettingsData } from '@common/types';

import { McpServerSelectorItem } from './McpServerSelectorItem';

import { Checkbox } from '@/components/common/Checkbox';
import { TriStateCheckbox } from '@/components/common/TriStateCheckbox';
import { InfoIcon } from '@/components/common/InfoIcon';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { useSettings } from '@/context/SettingsContext';
import { useClickOutside } from '@/hooks/useClickOutside';

export const McpSelector = () => {
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const { settings, saveSettings } = useSettings();

  useClickOutside(selectorRef, () => setSelectorVisible(false));

  if (!settings) {
    return <div className="text-xs text-neutral-400">Loading...</div>;
  }

  const getTriState = (): 'checked' | 'unchecked' | 'indeterminate' => {
    const { disabledServers } = settings.mcpAgent;
    const serverCount = Object.keys(settings.mcpAgent.mcpServers).length;

    if (disabledServers.length === 0) {
      return 'checked';
    }
    if (disabledServers.length === serverCount) {
      return 'unchecked';
    }
    return 'indeterminate';
  };

  const handleToggleAllServers = () => {
    const { mcpAgent } = settings;
    const { disabledServers } = mcpAgent;
    const serverNames = Object.keys(mcpAgent.mcpServers);

    let updatedDisabledServers: string[];
    if (disabledServers.length === 0) {
      // If none are disabled, disable all
      updatedDisabledServers = serverNames;
    } else {
      // If some or all are disabled, enable all
      updatedDisabledServers = [];
    }

    const updatedSettings: SettingsData = {
      ...settings,
      mcpAgent: {
        ...mcpAgent,
        disabledServers: updatedDisabledServers,
      },
    };

    void saveSettings(updatedSettings);
  };

  const handleToggleEnabled = () => {
    const updatedSettings: SettingsData = {
      ...settings,
      mcpAgent: {
        ...settings.mcpAgent,
        agentEnabled: !settings.mcpAgent.agentEnabled,
      },
    };
    void saveSettings(updatedSettings);
  };

  const toggleSelectorVisible = () => {
    setSelectorVisible((prev) => !prev);
  };

  const toggleServer = (serverName: string) => {
    const { mcpAgent } = settings;
    const { disabledServers } = mcpAgent;

    let updatedDisabledServers: string[];

    if (disabledServers.includes(serverName)) {
      updatedDisabledServers = disabledServers.filter((name) => name !== serverName);
    } else {
      updatedDisabledServers = [...disabledServers, serverName];
    }

    const updatedSettings: SettingsData = {
      ...settings,
      mcpAgent: {
        ...mcpAgent,
        disabledServers: updatedDisabledServers,
      },
    };

    void saveSettings(updatedSettings);
  };

  const handleOpenSettings = () => {
    setSelectorVisible(false);
    setShowSettings(true);
  };

  const serverNames = Object.keys(settings.mcpAgent.mcpServers);
  const totalServers = serverNames.length;
  const enabledServers = totalServers - settings.mcpAgent.disabledServers.filter((name) => serverNames.includes(name)).length;

  const handleToggleIncludeContextFiles = () => {
    const updatedSettings: SettingsData = {
      ...settings,
      mcpAgent: {
        ...settings.mcpAgent,
        includeContextFiles: !settings.mcpAgent.includeContextFiles,
      },
    };
    void saveSettings(updatedSettings);
  };

  const handleToggleUseAiderTools = () => {
    const updatedSettings: SettingsData = {
      ...settings,
      mcpAgent: {
        ...settings.mcpAgent,
        useAiderTools: !settings.mcpAgent.useAiderTools,
      },
    };
    void saveSettings(updatedSettings);
  };

  const renderConfigureServersButton = () => (
    <>
      <div className="py-1 border-b border-neutral-700 ">
        <div className="px-3 py-1 text-xs text-neutral-300 flex items-center gap-2">
          <Checkbox checked={settings.mcpAgent.useAiderTools} onChange={handleToggleUseAiderTools} label="Use Aider tools" className="flex-1 mr-1" />
          <InfoIcon tooltip="MCP agent can use Aider to manage context files and run prompts." />
        </div>
        <div className="px-3 py-1 text-xs text-neutral-300 flex items-center gap-2">
          <Checkbox
            checked={settings.mcpAgent.includeContextFiles}
            onChange={handleToggleIncludeContextFiles}
            label="Include context files"
            className="flex-1 mr-1"
          />
          <InfoIcon tooltip="Adds content of context files into the chat of MCP agent. This will increase token usage." />
        </div>
      </div>
      <button onClick={handleOpenSettings} className="w-full flex items-center px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-700 transition-colors">
        <MdSettings className="w-3 h-3 mr-2" />
        Configure servers
      </button>
    </>
  );

  return (
    <div className="relative" ref={selectorRef}>
      <button
        onClick={toggleSelectorVisible}
        className="flex items-center hover:text-neutral-300 focus:outline-none transition-colors duration-200 text-xs ml-3"
      >
        {serverNames.length > 0 && <Checkbox checked={settings.mcpAgent.agentEnabled} onChange={handleToggleEnabled} className="mr-2" />}
        <span>
          {settings.mcpAgent.agentEnabled && (enabledServers > 0 || settings.mcpAgent.useAiderTools)
            ? enabledServers === 0
              ? `MCP agent enabled (aider only${settings.mcpAgent.includeContextFiles ? ', with files' : ''})`
              : `MCP agent enabled (${enabledServers} server${enabledServers === 1 ? '' : 's'}${settings.mcpAgent.useAiderTools ? ' + aider' : ''}${settings.mcpAgent.includeContextFiles ? ', with files' : ''})`
            : 'MCP agent disabled'}
        </span>
        <MdKeyboardArrowUp className="w-3 h-3 ml-0.5" />
      </button>

      {selectorVisible && (
        <div className="absolute bottom-full right-0 mb-1 bg-neutral-900 border border-neutral-700 rounded-md shadow-lg z-10 ml-2 min-w-[250px]">
          {serverNames.length > 0 ? (
            <>
              <div
                className="px-3 py-2 text-xs font-medium text-neutral-300 border-b border-neutral-700 mb-1 flex items-center select-none cursor-pointer"
                onClick={handleToggleAllServers}
              >
                <TriStateCheckbox state={getTriState()} onChange={handleToggleAllServers} className="mr-2" label="MCP Servers" />
              </div>
              {serverNames.map((serverName) => (
                <McpServerSelectorItem
                  key={serverName}
                  serverName={serverName}
                  disabled={settings.mcpAgent.disabledServers.includes(serverName)}
                  disabledTools={settings.mcpAgent.disabledTools}
                  onToggle={toggleServer}
                />
              ))}
              <div className="border-t border-neutral-700 mt-1">{renderConfigureServersButton()}</div>
            </>
          ) : (
            renderConfigureServersButton()
          )}
        </div>
      )}

      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} initialTab={2} />}
    </div>
  );
};
