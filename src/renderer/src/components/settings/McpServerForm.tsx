import { McpServerConfig } from '@common/types';
import { useState, useMemo, ChangeEvent } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

import { TextArea } from '@/components/common/TextArea';
import { Button } from '@/components/common/Button';

export const McpServerConfigSchema = z.object({
  mcpServers: z.record(
    z.object({
      command: z.string(),
      args: z.array(z.string()).readonly(),
      env: z.record(z.string()).readonly().optional(),
      enabled: z.boolean().optional(),
    }),
  ),
});

type Props = {
  onSave: (servers: Record<string, McpServerConfig>) => void;
  onCancel: () => void;
  initialName?: string;
  initialConfig?: McpServerConfig;
};

export const McpServerForm = ({ onSave, onCancel, initialName, initialConfig }: Props) => {
  const { t } = useTranslation();
  const [configJSON, setConfigJSON] = useState(() => {
    if (initialName && initialConfig) {
      return JSON.stringify(
        {
          mcpServers: {
            [initialName]: initialConfig,
          },
        },
        null,
        2,
      );
    }
    return '';
  });

  const isValidJson = useMemo(() => {
    try {
      const parsed = JSON.parse(configJSON);
      const result = McpServerConfigSchema.safeParse(parsed);
      return result.success;
    } catch {
      return false;
    }
  }, [configJSON]);

  const handleAddServer = () => {
    if (isValidJson) {
      const parsed = JSON.parse(configJSON);
      onSave(parsed.mcpServers);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setConfigJSON(e.target.value);
  };

  return (
    <div>
      <div className="flex items-center mb-2 text-neutral-200">
        <button onClick={onCancel} className="mr-2 hover:bg-neutral-700 rounded-md p-2 text-md">
          <FaArrowLeft />
        </button>
        <h3 className="text-md font-medium uppercase">{initialName ? t('mcpServer.editServer', { name: initialName }) : t('mcpServer.addServer')}</h3>
      </div>
      <div className="mb-2">
        <TextArea
          label={t('mcpServer.serverConfigJson')}
          placeholder={t('mcpServer.pasteServerAs')}
          value={configJSON}
          onChange={handleChange}
          className={`w-full h-60 p-2 resize-none ${configJSON && !isValidJson ? 'border-red-800/50 focus:border-red-800/50' : ''}`}
        />
        <div className="text-xs text-gray-500 mt-1">{t('mcpServer.multipleServersHint')}</div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleAddServer} variant="contained" disabled={!isValidJson || !configJSON}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
};
