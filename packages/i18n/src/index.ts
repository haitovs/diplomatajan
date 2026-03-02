import commonEn from '../locales/en-US/common.json';
import dashboardEn from '../locales/en-US/dashboard.json';
import scenarioEn from '../locales/en-US/scenario.json';
import defenseEn from '../locales/en-US/defense.json';
import reportEn from '../locales/en-US/report.json';
import errorsEn from '../locales/en-US/errors.json';
import guideEn from '../locales/en-US/guide.json';

export const DEFAULT_LOCALE = 'en-US' as const;

export const dictionaries = {
  'en-US': {
    common: commonEn,
    dashboard: dashboardEn,
    scenario: scenarioEn,
    defense: defenseEn,
    report: reportEn,
    errors: errorsEn,
    guide: guideEn,
  },
} as const;

export type DictionaryLocale = keyof typeof dictionaries;
export type DictionaryNamespace = keyof (typeof dictionaries)['en-US'];
