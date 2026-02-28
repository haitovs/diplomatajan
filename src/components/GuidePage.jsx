import { BookOpenCheck, ChartNoAxesCombined, CircleCheckBig, ShieldAlert, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '../i18n/I18nProvider';

const MotionSection = motion.section;
const MotionArticle = motion.article;

const WORKFLOW_STEP_KEYS = ['compose', 'run', 'tune', 'compare', 'report'];
const USEFULNESS_KEYS = ['risk', 'decision', 'roi', 'alignment'];
const QUICK_START_KEYS = ['one', 'two', 'three', 'four', 'five'];

const WORKFLOW_ICONS = {
  compose: Sparkles,
  run: ShieldAlert,
  tune: ChartNoAxesCombined,
  compare: CircleCheckBig,
  report: BookOpenCheck,
};

export const GuidePage = () => {
  const { t } = useI18n();

  return (
    <MotionSection
      className="guide-layout"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <article className="glass-panel bastion-surface guide-hero p-6">
        <h2 className="text-2xl bastion-heading">{t('guide.title')}</h2>
        <p className="mt-2 text-sm text-bastion-text-mid">{t('guide.subtitle')}</p>

        <div className="guide-callout mt-5">
          <h3 className="text-lg bastion-heading">{t('guide.overview.title')}</h3>
          <p className="mt-2 text-sm text-bastion-text-mid guide-text-measure">{t('guide.overview.body')}</p>
        </div>
      </article>

      <article className="glass-panel bastion-surface p-6">
        <h3 className="text-lg bastion-heading">{t('guide.workflow.title')}</h3>
        <div className="guide-flow mt-4">
          {WORKFLOW_STEP_KEYS.map((stepKey, index) => {
            const Icon = WORKFLOW_ICONS[stepKey] || Sparkles;
            return (
              <MotionArticle
                key={stepKey}
                className="guide-step"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <div className="guide-step-icon" aria-hidden="true">
                  <Icon size={15} />
                </div>
                <div>
                  <h4 className="text-sm text-bastion-text-high">{t(`guide.workflow.steps.${stepKey}.title`)}</h4>
                  <p className="mt-1 text-xs text-bastion-text-mid">{t(`guide.workflow.steps.${stepKey}.body`)}</p>
                </div>
              </MotionArticle>
            );
          })}
        </div>
      </article>

      <article className="glass-panel bastion-surface p-6">
        <h3 className="text-lg bastion-heading">{t('guide.usefulness.title')}</h3>
        <div className="guide-utility-grid mt-4">
          {USEFULNESS_KEYS.map((key, index) => (
            <MotionArticle
              key={key}
              className="guide-utility-card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <h4 className="text-sm text-bastion-text-high">{t(`guide.usefulness.items.${key}.title`)}</h4>
              <p className="mt-2 text-xs text-bastion-text-mid">{t(`guide.usefulness.items.${key}.body`)}</p>
            </MotionArticle>
          ))}
        </div>
      </article>

      <article className="glass-panel bastion-surface p-6">
        <h3 className="text-lg bastion-heading">{t('guide.quickStart.title')}</h3>
        <ol className="guide-quickstart mt-4">
          {QUICK_START_KEYS.map((key) => (
            <li key={key} className="guide-quickstart-item">
              <span className="guide-bullet" aria-hidden="true" />
              <span className="text-sm text-bastion-text-mid">{t(`guide.quickStart.steps.${key}`)}</span>
            </li>
          ))}
        </ol>

        <div className="guide-callout mt-5">
          <h4 className="text-sm text-bastion-text-high">{t('guide.tips.title')}</h4>
          <p className="mt-1 text-xs text-bastion-text-mid">{t('guide.tips.body')}</p>
        </div>
      </article>
    </MotionSection>
  );
};
