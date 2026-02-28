import { TriangleAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '../i18n/I18nProvider';

const severityOrder = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};
const MotionSection = motion.section;

export const RecommendationsPanel = ({ items = [] }) => {
  const { t } = useI18n();

  const sorted = items.slice().sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

  return (
    <MotionSection
      className="glass-panel bastion-surface p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-xl bastion-heading">{t('defense.recommendations.title')}</h2>

      {sorted.length === 0 ? (
        <p className="mt-3 text-sm text-bastion-text-mid">{t('defense.recommendations.empty')}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {sorted.map((item) => (
            <article key={item.id} className="rounded-xl border border-bastion-line bg-bastion-panel p-4">
              <div className="flex flex-wrap items-center gap-2">
                <TriangleAlert size={15} className="text-warning" />
                <span className="text-sm text-bastion-text-high">{t(`defense.actionKeys.${item.actionKey}`)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-bastion-line px-2 py-1 text-bastion-text-mid">
                  {t('defense.recommendations.severity')}: {t(`defense.severity.${item.severity}`)}
                </span>
                <span className="rounded-full border border-bastion-line px-2 py-1 text-bastion-text-mid">
                  {t('defense.recommendations.effort')}: {t(`defense.effort.${item.implementationEffort}`)}
                </span>
                <span className="rounded-full border border-bastion-line px-2 py-1 text-bastion-accent-teal">
                  {t('defense.recommendations.impact')}: {item.expectedRiskDropPct}%
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </MotionSection>
  );
};
