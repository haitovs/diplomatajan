import commonEn from '../locales/en-US/common.json';
import dashboardEn from '../locales/en-US/dashboard.json';
import scenarioEn from '../locales/en-US/scenario.json';
import defenseEn from '../locales/en-US/defense.json';
import reportEn from '../locales/en-US/report.json';
import errorsEn from '../locales/en-US/errors.json';
import guideEn from '../locales/en-US/guide.json';

import commonTk from '../locales/tk-TM/common.json';
import dashboardTk from '../locales/tk-TM/dashboard.json';
import scenarioTk from '../locales/tk-TM/scenario.json';
import defenseTk from '../locales/tk-TM/defense.json';
import reportTk from '../locales/tk-TM/report.json';
import errorsTk from '../locales/tk-TM/errors.json';
import guideTk from '../locales/tk-TM/guide.json';

export const DEFAULT_LOCALE = 'tk-TM' as const;

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
  'tk-TM': {
    common: commonTk,
    dashboard: dashboardTk,
    scenario: scenarioTk,
    defense: defenseTk,
    report: reportTk,
    errors: errorsTk,
    guide: guideTk,
  },
} as const;

export type DictionaryLocale = keyof typeof dictionaries;
export type DictionaryNamespace = keyof (typeof dictionaries)['en-US'];
