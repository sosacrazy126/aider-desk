import { useNavigate } from 'react-router-dom';
import { FaSave } from 'react-icons/fa';
import { useSettings } from 'hooks/useSettings';
import { AiderSettings } from 'components/settings/AiderSettings';

export const Settings = () => {
  const navigate = useNavigate();
  const { settings, setSettings, saveSettings } = useSettings();

  const handleSave = async () => {
    await saveSettings();
    navigate(-1);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="flex flex-col min-h-screen h-full bg-neutral-900 text-neutral-100 overflow-y-auto">
      <div className="flex-1 container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-lg font-bold text-neutral-100">Settings</h1>
          <div className="flex items-center space-x-2">
            <button onClick={handleCancel} className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded">
              Cancel
            </button>
            <button onClick={handleSave} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded flex items-center space-x-2">
              <FaSave />
              <span>Save</span>
            </button>
          </div>
        </div>

        {settings && (
          <div className="bg-neutral-850 shadow-lg rounded-lg p-6 space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-neutral-100">Aider</h2>
              <AiderSettings settings={settings} setSettings={setSettings} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
