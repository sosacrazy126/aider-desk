import { PROVIDER_MODELS, ProviderName } from '@common/llm-providers';

import { Option, Select } from '@/components/common/Select';

type Props = {
  providerName: ProviderName;
  currentModel: string;
  onChange: (model: string) => void;
};

export const ModelSelect = ({ providerName, currentModel, onChange }: Props) => {
  const handleChange = (value: string) => {
    onChange(value);
  };

  const getModelOptions = (): Option[] => {
    const models = PROVIDER_MODELS[providerName]?.models || {};
    return Object.keys(models).map((model) => ({
      value: model,
      label: model,
    }));
  };

  return <Select label="Model" value={currentModel} onChange={handleChange} options={getModelOptions()} />;
};
