import { SettingsData } from '@common/types';

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
  return (
    <>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-neutral-100">Options</label>
        <input
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
          className="w-full p-2 bg-neutral-800 border-2 border-neutral-600 rounded focus:outline-none focus:border-neutral-200 text-neutral-100 text-sm placeholder-neutral-500"
          placeholder={OPTIONS_PLACEHOLDER}
        />
        <p className="text-xs text-neutral-200">
          Check the documentation for available options at{' '}
          <a href="https://aider.chat/docs/config/options.html" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
            https://aider.chat/docs/config/options.html
          </a>
        </p>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-neutral-100">Environment Variables</label>
        <textarea
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
          className="w-full p-2 bg-neutral-800 border-2 border-neutral-600 rounded focus:outline-none focus:border-neutral-200 text-neutral-100 min-h-[300px] text-sm placeholder-neutral-500"
          placeholder={ENV_VARIABLES_PLACEHOLDER}
        />
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
