import { ReactCountryFlag } from 'react-country-flag';
import { useTranslation } from 'react-i18next';

import Select, { Option } from '../common/Select';

import { SUPPORTED_LANGUAGES } from '@/i18n';

type Props = {
  language: string;
  onChange: (language: string) => void;
  hideLabel?: boolean;
};

export const LanguageSelector = ({ language, onChange, hideLabel }: Props) => {
  const { t } = useTranslation();
  const languageOptions: Option[] = Object.entries(SUPPORTED_LANGUAGES).map(([code, { label, countryCode }]) => ({
    value: code,
    label: (
      <div className="flex items-center gap-2">
        <ReactCountryFlag countryCode={countryCode} />
        <span>{t(`languages.${code}`, { defaultValue: label })}</span>
      </div>
    ),
  }));

  return <Select label={!hideLabel && t('settings.language')} value={language} onChange={onChange} options={languageOptions} />;
};
