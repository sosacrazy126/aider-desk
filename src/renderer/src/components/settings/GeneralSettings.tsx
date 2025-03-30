import { SettingsData } from '@common/types';

import { Checkbox } from '@/components/common/Checkbox';

type Props = {
  settings: SettingsData;
  setSettings: (settings: SettingsData) => void;
};

export const GeneralSettings = ({ settings, setSettings }: Props) => {
  const handleLoadLastSessionMessagesChange = () => {
    setSettings({
      ...settings,
      loadLastSessionMessages: !settings.loadLastSessionMessages,
    });
  };

  const handleLoadLastSessionFilesChange = () => {
    setSettings({
      ...settings,
      loadLastSessionFiles: !settings.loadLastSessionFiles,
    });
  };

  return (
    <div className="space-y-6 min-h-[300px]">
      <div className="relative border border-neutral-700 rounded-md pt-2 mt-4">
        <h2 className="absolute -top-3 left-4 px-2 bg-neutral-850 text-sm font-medium text-neutral-100">Start Up</h2>
        <div className="px-4 py-3 space-y-1">
          <Checkbox
            label="Load context messages from last session"
            checked={!!settings.loadLastSessionMessages}
            onChange={handleLoadLastSessionMessagesChange}
          />
          <Checkbox label="Load context files from last session" checked={!!settings.loadLastSessionFiles} onChange={handleLoadLastSessionFilesChange} />
        </div>
      </div>
    </div>
  );
};
