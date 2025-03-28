import { useState } from 'react';
import { HiEye } from 'react-icons/hi';
import { SettingsData } from '@common/types';

import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { TextArea } from '@/components/common/TextArea';

const OPTIONS_PLACEHOLDER = 'e.g. --no-auto-commits --cache-prompts';

const ENV_VARIABLES_PLACEHOLDER = `#################
# LLM parameters:
#
# Include xxx_API_KEY parameters and other params needed for your LLMs.
# See https://aider.chat/docs/llms.html for details.

## OpenAI
#OPENAI_API_KEY=

## Anthropic
#ANTHROPIC_API_KEY=`;

type Props = {
  settings: SettingsData;
  setSettings: (settings: SettingsData) => void;
};

export const AiderSettings = ({ settings, setSettings }: Props) => {
  const [showEnvVars, setShowEnvVars] = useState(false);

  return (
    <>
      <div className="space-y-1">
        <Input
          label="Options"
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
          placeholder={OPTIONS_PLACEHOLDER}
        />
        <p className="text-xs text-neutral-200">
          Check the documentation for available options at{' '}
          <a href="https://aider.chat/docs/config/options.html" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
            https://aider.chat/docs/config/options.html
          </a>
        </p>
      </div>

      <div className="space-y-1 mt-4">
        <div className="relative">
          <TextArea
            label="Environment Variables"
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
            placeholder={ENV_VARIABLES_PLACEHOLDER}
          />
          {!showEnvVars && (
            <div className="absolute inset-0 top-[26px] bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center rounded-md border border-neutral-700">
              <Button variant="text" color="secondary" onClick={() => setShowEnvVars(true)} className="flex items-center ">
                <HiEye className="mr-2" /> Show Secrets
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs text-neutral-400">
          Check the documentation for environment variables at{' '}
          <a href="https://aider.chat/docs/config/dotenv.html" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
            https://aider.chat/docs/config/dotenv.html
          </a>
        </p>
      </div>
    </>
  );
};
