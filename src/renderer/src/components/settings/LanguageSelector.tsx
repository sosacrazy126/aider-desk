import ReactCountryFlag from 'react-country-flag';

import Select, { Option } from '../common/Select';

import { SUPPORTED_LANGUAGES } from '@/i18n';

type Props = {
  language: string;
  onChange: (language: string) => void;
};

export const LanguageSelector = ({ language, onChange }: Props) => {
  const languageOptions: Option[] = Object.entries(SUPPORTED_LANGUAGES).map(([code, { label, countryCode }]) => ({
    value: code,
    label: (
      <div className="flex items-center gap-2">
        <ReactCountryFlag countryCode={countryCode} />
        <span>{label}</span>
      </div>
    ),
  }));

  return <Select label="Language" value={language} onChange={onChange} options={languageOptions} />;
};
