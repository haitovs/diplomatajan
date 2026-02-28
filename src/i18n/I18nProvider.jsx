/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import commonEn from '../../packages/i18n/locales/en-US/common.json';
import dashboardEn from '../../packages/i18n/locales/en-US/dashboard.json';
import scenarioEn from '../../packages/i18n/locales/en-US/scenario.json';
import defenseEn from '../../packages/i18n/locales/en-US/defense.json';
import reportEn from '../../packages/i18n/locales/en-US/report.json';
import errorsEn from '../../packages/i18n/locales/en-US/errors.json';
import guideEn from '../../packages/i18n/locales/en-US/guide.json';
import commonTk from '../../packages/i18n/locales/tk-TM/common.json';
import dashboardTk from '../../packages/i18n/locales/tk-TM/dashboard.json';
import scenarioTk from '../../packages/i18n/locales/tk-TM/scenario.json';
import defenseTk from '../../packages/i18n/locales/tk-TM/defense.json';
import reportTk from '../../packages/i18n/locales/tk-TM/report.json';
import errorsTk from '../../packages/i18n/locales/tk-TM/errors.json';
import guideTk from '../../packages/i18n/locales/tk-TM/guide.json';

const DEFAULT_LOCALE = 'tk-TM';
const STORAGE_KEY = 'bastion-locale';

const locales = {
  'tk-TM': {
    common: commonTk,
    dashboard: dashboardTk,
    scenario: scenarioTk,
    defense: defenseTk,
    report: reportTk,
    errors: errorsTk,
    guide: guideTk,
  },
  'en-US': {
    common: commonEn,
    dashboard: dashboardEn,
    scenario: scenarioEn,
    defense: defenseEn,
    report: reportEn,
    errors: errorsEn,
    guide: guideEn,
  },
};

const I18nContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
  formatNumber: (value) => String(value),
  formatDate: (value) => String(value),
  supportedLocales: ['tk-TM', 'en-US'],
});

const getByPath = (obj, path) =>
  path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);

const interpolate = (value, params = {}) => {
  if (typeof value !== 'string') return value;
  return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    if (params[key] === undefined || params[key] === null) return '';
    return String(params[key]);
  });
};

export const I18nProvider = ({ children }) => {
  const [locale, setLocale] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_LOCALE;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved && locales[saved] ? saved : DEFAULT_LOCALE;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, locale);
    }
  }, [locale]);

  const value = useMemo(() => {
    const t = (key, params = {}) => {
      const languagePack = locales[locale] || locales[DEFAULT_LOCALE];
      const fallbackPack = locales[DEFAULT_LOCALE];
      const result = getByPath(languagePack, key) ?? getByPath(fallbackPack, key) ?? key;
      return interpolate(result, params);
    };

    const formatNumber = (number, options = {}) => {
      if (!Number.isFinite(number)) return '0';
      return new Intl.NumberFormat(locale, options).format(number);
    };

    const formatDate = (dateValue, options = {}) => {
      const date = typeof dateValue === 'number' ? new Date(dateValue) : dateValue;
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '--';
      return new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
        ...options,
      }).format(date);
    };

    return {
      locale,
      setLocale: (nextLocale) => {
        if (!locales[nextLocale]) return;
        setLocale(nextLocale);
      },
      t,
      formatNumber,
      formatDate,
      supportedLocales: Object.keys(locales),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
