import { useEffect, useState } from 'react';
import { CgSpinner } from 'react-icons/cg';
import { useTranslation } from 'react-i18next';
import { SERVER_TOOL_SEPARATOR } from '@common/utils';

import { Checkbox } from '../common/Checkbox';

type Props = {
  serverName: string;
  disabled: boolean;
  disabledTools: string[];
  onToggle: (serverName: string) => void;
};

export const McpServerSelectorItem = ({ serverName, disabled, disabledTools, onToggle }: Props) => {
  const { t } = useTranslation();
  const [toolsCount, setToolsCount] = useState<number | null>(null);

  useEffect(() => {
    const loadTools = async () => {
      try {
        const tools = await window.api.loadMcpServerTools(serverName);
        setToolsCount((tools?.length ?? 0) - disabledTools.filter((toolName) => toolName.startsWith(`${serverName}${SERVER_TOOL_SEPARATOR}`)).length);
      } catch (error) {
        console.error('Failed to load MCP server tools:', error);
        setToolsCount(0);
      }
    };

    void loadTools();
  }, [disabledTools, serverName]);

  return (
    <div className="flex items-center justify-between px-3 py-1 hover:bg-neutral-800 cursor-pointer text-xs" onClick={() => onToggle(serverName)}>
      <Checkbox checked={!disabled} onChange={() => onToggle(serverName)} className="mr-1" label={serverName} />
      {toolsCount === null ? (
        <CgSpinner className="animate-spin text-xs text-neutral-700 ml-2" />
      ) : (
        <span className="text-xxs text-neutral-700 ml-2 whitespace-nowrap">{t('mcp.toolsCount', { count: toolsCount })}</span>
      )}
    </div>
  );
};
