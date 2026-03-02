/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const DEFAULT_LOCALE = 'en-US';
const STORAGE_KEY = 'bastion-locale';
const REQUIRED_NAMESPACE = 'common';

const localeModules = import.meta.glob('../../packages/i18n/locales/*/*.json', { eager: true });

const locales = Object.entries(localeModules).reduce((acc, [filePath, module]) => {
  const match = filePath.match(/locales\/([^/]+)\/([^/]+)\.json$/);
  if (!match) return acc;

  const [, localeCode, namespace] = match;
  if (!acc[localeCode]) {
    acc[localeCode] = {};
  }

  acc[localeCode][namespace] = module.default ?? module;
  return acc;
}, {});

if (!locales[DEFAULT_LOCALE]) {
  locales[DEFAULT_LOCALE] = {};
}

const supportedLocales = Array.from(
  new Set([
    DEFAULT_LOCALE,
    ...Object.keys(locales)
      .filter((localeCode) => localeCode !== DEFAULT_LOCALE && Boolean(locales[localeCode]?.[REQUIRED_NAMESPACE]))
      .sort((a, b) => a.localeCompare(b)),
  ]),
);

const I18nContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
  formatNumber: (value) => String(value),
  formatDate: (value) => String(value),
  supportedLocales,
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
    return saved && supportedLocales.includes(saved) ? saved : DEFAULT_LOCALE;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, locale);
    }
  }, [locale]);

  const value = useMemo(() => {
    const resolvedLocale = supportedLocales.includes(locale) ? locale : DEFAULT_LOCALE;

    const t = (key, params = {}) => {
      const languagePack = locales[resolvedLocale] || {};
      const fallbackPack = locales[DEFAULT_LOCALE] || {};
      const result = getByPath(languagePack, key) ?? getByPath(fallbackPack, key) ?? key;
      return interpolate(result, params);
    };

    const formatNumber = (number, options = {}) => {
      if (!Number.isFinite(number)) return '0';
      return new Intl.NumberFormat(resolvedLocale, options).format(number);
    };

    const formatDate = (dateValue, options = {}) => {
      const date = typeof dateValue === 'number' ? new Date(dateValue) : dateValue;
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '--';
      return new Intl.DateTimeFormat(resolvedLocale, {
        dateStyle: 'medium',
        timeStyle: 'short',
        ...options,
      }).format(date);
    };

    return {
      locale: resolvedLocale,
      setLocale: (nextLocale) => {
        if (!supportedLocales.includes(nextLocale)) return;
        setLocale(nextLocale);
      },
      t,
      formatNumber,
      formatDate,
      supportedLocales,
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
