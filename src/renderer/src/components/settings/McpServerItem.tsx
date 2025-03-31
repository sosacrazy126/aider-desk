import { McpServerConfig, McpTool } from '@common/types';
import { useEffect, useState } from 'react';
import { FaPencilAlt, FaTrash } from 'react-icons/fa';

import { McpToolItem } from './McpToolItem';

import { Accordion } from '@/components/common/Accordion';
import { IconButton } from '@/components/common/IconButton';

type Props = {
  serverName: string;
  config: McpServerConfig;
  onRemove: () => void;
  onEdit?: () => void;
  toggleToolDisabled: (toolId: string) => void;
  disabledTools: string[];
};

export const McpServerItem = ({ serverName, config, onRemove, onEdit, toggleToolDisabled, disabledTools }: Props) => {
  const [tools, setTools] = useState<McpTool[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTools = async () => {
      try {
        const loadedTools = await window.api.loadMcpServerTools(serverName, config);
        setTools(loadedTools);
      } catch (error) {
        console.error('Failed to load MCP server tools:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadTools();
  }, [serverName, config]);

  const renderTitle = () => {
    return (
      <div className="flex items-center justify-between w-full">
        <span className="text-sm">{serverName}</span>
        <div className="flex items-center">
          {loading ? (
            <span className="text-xs text-neutral-400">Loading...</span>
          ) : (
            tools !== null &&
            tools.length > 0 && (
              <span className="text-xs mr-3 text-neutral-400">
                {(() => {
                  const enabledCount = tools.length - disabledTools.filter((disabledTool) => disabledTool.startsWith(serverName)).length;
                  return enabledCount === tools.length ? `${tools.length} tools` : `${enabledCount} of ${tools.length} tools`;
                })()}
              </span>
            )
          )}
          {!loading && (
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full flex items-center justify-center ${tools && tools.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                {/* Empty div for color indicator */}
              </div>
            </div>
          )}
          {onEdit && <IconButton icon={<FaPencilAlt className="text-neutral-200" />} onClick={onEdit} tooltip="Edit server" className="ml-4" />}
          <IconButton icon={<FaTrash className="text-red-500/60" />} onClick={onRemove} tooltip="Remove server" className="ml-3" />
        </div>
      </div>
    );
  };

  return (
    <div className="border border-neutral-700 rounded mb-1">
      <Accordion title={renderTitle()} buttonClassName="px-2">
        {loading ? (
          <div className="text-xs text-neutral-500 p-2">Loading tools...</div>
        ) : tools && tools.length > 0 ? (
          <div>
            <div className="text-xs p-2 rounded mt-1 space-y-2">
              {tools.map((tool) => (
                <McpToolItem
                  key={tool.name}
                  tool={tool}
                  toggleDisabled={() => toggleToolDisabled(`${serverName}-${tool.name}`)}
                  isDisabled={disabledTools.includes(`${serverName}-${tool.name}`)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs text-neutral-500 p-4">No tools could be found. Check your configuration.</div>
        )}
      </Accordion>
    </div>
  );
};
