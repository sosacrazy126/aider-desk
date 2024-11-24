import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OPTIONS_PLACEHOLDER = 'e.g. --no-auto-commits --lint-cmd python: flake8 –select=…';

const ENV_VARIABLES_PLACEHOLDER = `#################
# LLM parameters:
#
# Include xxx_API_KEY parameters and other params needed for your LLMs.
# See https://aider.chat/docs/llms.html for details.

## OpenAI
#OPENAI_API_KEY=

## Anthropic
#ANTHROPIC_API_KEY=`;

export const Settings = () => {
  const navigate = useNavigate();
  const [options, setOptions] = useState('');
  const [environmentVariables, setEnvironmentVariables] = useState('');

  useEffect(() => {
    console.log('Loading settings...');
    const loadSettings = async () => {
      const settings = await window.api.loadSettings();
      setOptions(settings.aider.options);
      setEnvironmentVariables(settings.aider.environmentVariables);
    };
    void loadSettings();
  }, []);

  const handleSave = async () => {
    await window.api.saveSettings({
      aider: {
        options,
        environmentVariables,
      },
    });
    navigate(-1);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="flex flex-col min-h-screen h-full bg-neutral-900 text-neutral-100">
      <div className="flex-1 container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-lg font-bold text-neutral-100">Settings</h1>
          <div className="space-x-2">
            <button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
              Save
            </button>
            <button onClick={handleCancel} className="bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded">
              Cancel
            </button>
          </div>
        </div>

        <div className="bg-neutral-800 shadow-lg rounded-lg p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-100">Aider</h2>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-300">Options</label>
              <input
                type="text"
                value={options}
                spellCheck={false}
                onChange={(e) => setOptions(e.target.value)}
                className="w-full p-2 bg-neutral-700 border-2 border-neutral-600 rounded focus:outline-none focus:border-neutral-400 text-neutral-100 text-sm placeholder-neutral-600"
                placeholder={OPTIONS_PLACEHOLDER}
              />
              <p className="text-xs text-neutral-400">
                Check the documentation for available options at{' '}
                <a href="https://aider.chat/docs/config/options.html" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  https://aider.chat/docs/config/options.html
                </a>
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-300">Environment Variables</label>
              <textarea
                value={environmentVariables}
                onChange={(e) => setEnvironmentVariables(e.target.value)}
                spellCheck={false}
                className="w-full p-2 bg-neutral-700 border-2 border-neutral-600 rounded focus:outline-none focus:border-neutral-400 text-neutral-100 min-h-[300px] text-sm placeholder-neutral-600"
                placeholder={ENV_VARIABLES_PLACEHOLDER}
              />
              <p className="text-xs text-neutral-400">
                Check the documentation for environment variables at{' '}
                <a href="https://aider.chat/docs/config/dotenv.html" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  https://aider.chat/docs/config/dotenv.html
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
