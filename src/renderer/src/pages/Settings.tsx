import { AiderSettings } from 'components/settings/AiderSettings';
import { SettingsData } from '@common/types';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';

type Props = {
  settings: SettingsData;
  updateSettings: (settings: SettingsData) => void;
};

export const Settings = ({ settings, updateSettings }: Props) => {
  return (
    <TabGroup className="flex flex-col flex-1 min-h-0">
      <TabList className="flex space-x-2  backdrop-blur-sm border border-neutral-800 rounded-t-lg">
        <Tab
          className={({ selected }) =>
            `px-4 py-2 text-sm font-medium border-b-2 rounded-t-md transition-colors duration-200 bg-neutral-850 uppercase ${
              selected ? 'border-neutral-600 text-neutral-100' : 'border-transparent text-neutral-400 hover:border-neutral-400/50 hover:text-neutral-200'
            }`
          }
        >
          Aider
        </Tab>
      </TabList>
      <TabPanels className="flex flex-col flex-1 overflow-hidden">
        <TabPanel className="flex flex-col flex-1 min-h-0 bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-tr-lg rounded-b-lg mt-[-1px]">
          <div className="p-6 overflow-y-auto">
            <AiderSettings settings={settings} setSettings={updateSettings} />
          </div>
        </TabPanel>
      </TabPanels>
    </TabGroup>
  );
};

export default Settings;
