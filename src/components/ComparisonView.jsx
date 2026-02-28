import { motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useI18n } from '../i18n/I18nProvider';

const buildComparisonRows = (baseline, hardened) => [
  {
    metric: 'Blocked',
    baseline: baseline?.blockedRequests || 0,
    hardened: hardened?.blockedRequests || 0,
  },
  {
    metric: 'Failed Auth',
    baseline: baseline?.failedAuth || 0,
    hardened: hardened?.failedAuth || 0,
  },
  {
    metric: 'Successful Logins',
    baseline: baseline?.successfulLogins || 0,
    hardened: hardened?.successfulLogins || 0,
  },
  {
    metric: 'Peak RPS',
    baseline: baseline?.peakRps || 0,
    hardened: hardened?.peakRps || 0,
  },
];
const MotionSection = motion.section;

export const ComparisonView = ({ baselineSnapshot, hardenedSnapshot }) => {
  const { t, formatNumber } = useI18n();

  const rows = buildComparisonRows(baselineSnapshot, hardenedSnapshot);
  const hasSnapshots = baselineSnapshot && hardenedSnapshot;

  return (
    <MotionSection
      className="glass-panel bastion-surface p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-2xl bastion-heading">{t('common.navigation.comparison')}</h2>
      <p className="text-sm text-bastion-text-mid mt-1">{t('report.sections.comparison')}</p>

      {!hasSnapshots && (
        <div className="mt-6 rounded-xl border border-bastion-line bg-bastion-panel p-4 text-sm text-bastion-text-mid">
          {t('errors.missingSnapshots')}
        </div>
      )}

      {hasSnapshots && (
        <>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#29414d" />
                <XAxis dataKey="metric" stroke="#a7b8b1" fontSize={12} />
                <YAxis stroke="#a7b8b1" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#122128',
                    border: '1px solid rgba(201, 222, 214, 0.18)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="baseline" fill="#d9382c" name={t('report.labels.baseline')} radius={[4, 4, 0, 0]} />
                <Bar dataKey="hardened" fill="#1fa89a" name={t('report.labels.hardened')} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {rows.map((row) => {
              const delta = row.hardened - row.baseline;
              return (
                <div key={row.metric} className="rounded-xl border border-bastion-line bg-bastion-panel p-4">
                  <div className="text-xs text-bastion-text-mid">{row.metric}</div>
                  <div className="mt-2 text-sm text-bastion-text-high">
                    {t('report.labels.baseline')}: {formatNumber(row.baseline)}
                  </div>
                  <div className="text-sm text-bastion-text-high">
                    {t('report.labels.hardened')}: {formatNumber(row.hardened)}
                  </div>
                  <div className={`text-sm mt-1 ${delta >= 0 ? 'text-bastion-accent-teal' : 'text-danger'}`}>
                    Δ {formatNumber(delta)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </MotionSection>
  );
};
