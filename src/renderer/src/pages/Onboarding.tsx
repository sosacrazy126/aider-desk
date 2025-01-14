import { useState } from 'react';
import { HiArrowRight } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { useSettings } from 'hooks/useSettings';
import { AiderSettings } from 'components/settings/AiderSettings';

export const Onboarding = () => {
  const navigate = useNavigate();
  const { settings, setSettings, saveSettings } = useSettings();
  const [step, setStep] = useState(1);

  const handleNext = async () => {
    if (step === 2) {
      await saveSettings({
        ...settings!,
        onboardingFinished: true,
      });
      navigate('/home');
    } else {
      setStep(step + 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col space-y-4">
            <h1 className="text-xl font-bold text-neutral-100 uppercase">Welcome to Aider Desk</h1>
            <p className="text-neutral-300 text-sm">
              Aider Desk is your desktop companion for AI-assisted coding. This application brings the power of Aider&#39;s AI coding assistant to a
              user-friendly interface, helping you:
            </p>
            <ul className="list-disc list-inside text-neutral-300 space-y-2 text-sm">
              <li>Manage multiple coding projects</li>
              <li>Track your AI usage and costs</li>
              <li>Interact with AI models in a structured way</li>
              <li>Visualize and manage your code files</li>
            </ul>
            <p className="text-neutral-300 text-sm">Let&#39;s get started by configuring your Aider settings.</p>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-100 uppercase">Aider Configuration</h2>
            <p className="text-neutral-300 text-sm">To get started, please configure your Aider settings. You&#39;ll need to:</p>
            <ul className="list-disc list-inside text-neutral-300 space-y-2 text-sm">
              <li>Add your API keys for the LLM provider you want to use</li>
              <li>Set any additional options for Aider</li>
            </ul>
            <p className="text-neutral-300 text-sm">You can also do that later in the Settings menu.</p>
            <AiderSettings settings={settings!} setSettings={setSettings} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen p-[4px] bg-gradient-to-b from-neutral-950 to-neutral-900 overflow-y-auto">
      <div className="flex flex-col flex-1 border-2 border-neutral-600">
        <div className="flex-1 flex flex-col justify-center items-center p-4">
          <div className="max-w-2xl w-full">
            {renderStep()}
            <div className="mt-10 flex justify-center">
              <button onClick={handleNext} className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 flex items-center gap-2">
                {step === 2 ? 'Complete Setup' : 'Next'}
                <HiArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
