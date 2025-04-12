import { useState } from 'react';
import { HiEye } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';
import { SettingsData } from '@common/types';

import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { TextArea } from '@/components/common/TextArea';

type Props = {
  settings: SettingsData;
  setSettings: (settings: SettingsData) => void;
  initialShowEnvVars?: boolean;
};

export const AiderSettings = ({ settings, setSettings, initialShowEnvVars = false }: Props) => {
  const { t } = useTranslation();
  const [showEnvVars, setShowEnvVars] = useState(initialShowEnvVars);

  return (
    <>
      <div className="space-y-1">
        <Input
          label={t('settings.aider.options')}
          type="text"
          value={settings.aider.options}
          spellCheck={false}
          onChange={(e) =>
            setSettings({
              ...settings,
              aider: {
                ...settings.aider,
                options: e.target.value,
              },
            })
          }
          placeholder={t('settings.aider.optionsPlaceholder')}
        />
        <p className="text-xs text-neutral-200">
          {t('settings.aider.optionsDocumentation')}{' '}
          <a href="https://aider.chat/docs/config/options.html" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
            https://aider.chat/docs/config/options.html
          </a>
        </p>
      </div>

      <div className="space-y-1 mt-4">
        <div className="relative">
          <TextArea
            label={t('settings.aider.environmentVariables')}
            value={settings.aider.environmentVariables}
            onChange={(e) =>
              setSettings({
                ...settings,
                aider: {
                  ...settings.aider,
                  environmentVariables: e.target.value,
                },
              })
            }
            spellCheck={false}
            className="min-h-[300px]"
            placeholder={t('settings.aider.envVarsPlaceholder')}
          />
          {!showEnvVars && (
            <div className="absolute inset-0 top-[26px] bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center rounded-md border border-neutral-700">
              <Button variant="text" color="secondary" onClick={() => setShowEnvVars(true)} className="flex items-center ">
                <HiEye className="mr-2" /> {t('settings.common.showSecrets')}
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs text-neutral-400">
          {t('settings.aider.envVarsDocumentation')}{' '}
          <a href="https://aider.chat/docs/config/dotenv.html" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
            https://aider.chat/docs/config/dotenv.html
          </a>
        </p>
      </div>
    </>
  );
};
