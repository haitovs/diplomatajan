import { Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '../i18n/I18nProvider';

const serializeRecommendation = (recommendation, t) =>
  `- ${t(`defense.actionKeys.${recommendation.actionKey}`)} (${t(`defense.severity.${recommendation.severity}`)}, ${recommendation.expectedRiskDropPct}%)`;
const MotionSection = motion.section;

export const ReportExporter = ({
  scenario,
  baselineSnapshot,
  hardenedSnapshot,
  recommendations = [],
  onCaptureBaseline,
  onCaptureHardened,
  onGoWorkspace,
}) => {
  const { t, formatDate } = useI18n();

  const canExport = scenario && baselineSnapshot && hardenedSnapshot;

  const buildReport = (languageMode) => {
    const now = Date.now();
    const lines = [
      `# ${t('common.appName')} - ${t('report.title')}`,
      `${t('report.labels.generatedAt')}: ${formatDate(now)}`,
      `${t('report.labels.scenario')}: ${scenario?.name || '-'}`,
      '',
      `## ${t('report.sections.comparison')}`,
      `${t('report.labels.baseline')} -> requests: ${baselineSnapshot?.totalRequests ?? 0}, blocked: ${baselineSnapshot?.blockedRequests ?? 0}, failedAuth: ${baselineSnapshot?.failedAuth ?? 0}`,
      `${t('report.labels.hardened')} -> requests: ${hardenedSnapshot?.totalRequests ?? 0}, blocked: ${hardenedSnapshot?.blockedRequests ?? 0}, failedAuth: ${hardenedSnapshot?.failedAuth ?? 0}`,
      '',
      `## ${t('report.sections.recommendations')}`,
      ...(recommendations.length ? recommendations.map((item) => serializeRecommendation(item, t)) : ['- None']),
      '',
      `## ${t('report.sections.nextSteps')}`,
      '1. Validate recommended controls in staging.',
      '2. Apply policy changes in production windows.',
      '3. Re-run Bastion Twin scenario monthly.'
    ];

    return {
      content: lines.join('\n'),
      fileName: `bastion-report-${languageMode}-${now}.md`,
    };
  };

  const triggerDownload = (mode) => {
    const report = buildReport(mode);
    const blob = new Blob([report.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = report.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <MotionSection
      className="glass-panel bastion-surface p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-2xl bastion-heading">{t('report.title')}</h2>
      <p className="text-sm text-bastion-text-mid mt-1">{t('report.subtitle')}</p>

      {!canExport && (
        <div className="mt-4 rounded-xl border border-bastion-line bg-bastion-panel p-4">
          <p className="text-sm text-bastion-text-mid">{t('report.empty')}</p>
          <p className="mt-2 text-xs text-bastion-text-mid">{t('report.setupHelp')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="bastion-outline-btn" onClick={onCaptureBaseline}>
              {t('report.actions.captureBaseline')}
            </button>
            <button type="button" className="bastion-outline-btn" onClick={onCaptureHardened}>
              {t('report.actions.captureHardened')}
            </button>
            <button type="button" className="bastion-primary-btn" onClick={onGoWorkspace}>
              {t('report.actions.goWorkspace')}
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="bastion-outline-btn" onClick={() => triggerDownload('tk')} disabled={!canExport}>
          <Download size={15} />
          {t('report.actions.exportTk')}
        </button>
        <button type="button" className="bastion-outline-btn" onClick={() => triggerDownload('en')} disabled={!canExport}>
          <Download size={15} />
          {t('report.actions.exportEn')}
        </button>
        <button type="button" className="bastion-primary-btn" onClick={() => triggerDownload('both')} disabled={!canExport}>
          <Download size={15} />
          {t('report.actions.exportBoth')}
        </button>
      </div>
    </MotionSection>
  );
};
