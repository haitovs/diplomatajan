import { Languages } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

export const LanguageSwitcher = () => {
  const { locale, setLocale, t, supportedLocales } = useI18n();

  const getLocaleLabel = (code) => {
    const translation = t(`common.languages.${code}`);
    return translation === `common.languages.${code}` ? code : translation;
  };

  if (supportedLocales.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-bastion-line bg-bastion-panel px-3 py-2">
      <Languages size={15} className="text-bastion-text-mid" />
      <label htmlFor="locale-select" className="text-xs text-bastion-text-mid">
        {t('common.language')}
      </label>
      <select
        id="locale-select"
        value={locale}
        onChange={(event) => setLocale(event.target.value)}
        className="bastion-select text-xs"
        aria-label={t('common.language')}
      >
        {supportedLocales.map((code) => (
          <option key={code} value={code}>
            {getLocaleLabel(code)}
          </option>
        ))}
      </select>
    </div>
  );
};
