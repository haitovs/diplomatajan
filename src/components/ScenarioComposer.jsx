import { Activity, Play, Save, Square, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';

const TARGET_SURFACES = ['login', 'api', 'mixed'];
const BUSINESS_PROFILES = ['retail', 'fintech', 'education', 'saas'];
const MotionDiv = motion.div;
const MotionAside = motion.aside;

export const ScenarioComposer = ({
  attackTypes = [],
  draft,
  isUnderAttack = false,
  riskScore,
  scenarios = [],
  selectedScenarioId,
  onDraftChange,
  onSave,
  onRun,
  onStop,
  onSelectScenario,
  error,
  liveMode = false,
  targetUrl = 'http://localhost:10011/login',
  onLiveModeChange,
  onTargetUrlChange,
}) => {
  const { t, formatNumber } = useI18n();
  const selectedAttackType = attackTypes.find((item) => item.id === draft.attackType) || attackTypes[0];

  const riskLabel =
    riskScore >= 75
      ? t('scenario.risk.critical')
      : riskScore >= 55
        ? t('scenario.risk.high')
        : riskScore >= 30
          ? t('scenario.risk.medium')
          : t('scenario.risk.low');

  // Connection health check for live mode
  const [proxyReachable, setProxyReachable] = useState(null);
  const checkProxy = useCallback(() => {
    fetch('/api/health')
      .then(r => r.ok ? setProxyReachable(true) : setProxyReachable(false))
      .catch(() => setProxyReachable(false));
  }, []);
  useEffect(() => {
    if (!liveMode) { setProxyReachable(null); return; }
    checkProxy();
    const id = setInterval(checkProxy, 5000);
    return () => clearInterval(id);
  }, [liveMode, checkProxy]);

  return (
    <section className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <MotionDiv
        className="glass-panel bastion-surface p-6 xl:col-span-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-6">
          <h2 className="text-2xl bastion-heading">{t('scenario.title')}</h2>
          <p className="text-sm text-bastion-text-mid">{t('scenario.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="bastion-field">
            <span>{t('scenario.fields.name')}</span>
            <input
              value={draft.name}
              onChange={(e) => onDraftChange({ name: e.target.value })}
              className="bastion-input"
              placeholder={t('scenario.fields.name')}
            />
          </label>

          <label className="bastion-field">
            <span>{t('scenario.fields.attackType')}</span>
            <select
              value={draft.attackType}
              onChange={(e) => onDraftChange({ attackType: e.target.value })}
              className="bastion-select"
            >
              {attackTypes.map((attackType) => (
                <option key={attackType.id} value={attackType.id}>
                  {t(`scenario.attackType.${attackType.id}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="bastion-field">
            <span>{t('scenario.fields.targetSurface')}</span>
            <select
              value={draft.targetSurface}
              onChange={(e) => onDraftChange({ targetSurface: e.target.value })}
              className="bastion-select"
            >
              {TARGET_SURFACES.map((surface) => (
                <option key={surface} value={surface}>
                  {t(`scenario.targetSurface.${surface}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="bastion-field">
            <span>{t('scenario.fields.businessProfile')}</span>
            <select
              value={draft.businessProfile}
              onChange={(e) => onDraftChange({ businessProfile: e.target.value })}
              className="bastion-select"
            >
              {BUSINESS_PROFILES.map((profile) => (
                <option key={profile} value={profile}>
                  {t(`scenario.businessProfile.${profile}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="bastion-field md:col-span-2">
            <span>{t('scenario.fields.intensity')} ({draft.intensity}x)</span>
            <input
              type="range"
              min="1"
              max="20"
              value={draft.intensity}
              onChange={(e) => onDraftChange({ intensity: Number(e.target.value) })}
              className="w-full"
            />
          </label>
        </div>

        {/* Live Mode Controls */}
        <div className="mt-5 rounded-xl border border-bastion-line bg-bastion-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-bastion-accent-copper" />
              <span className="text-sm bastion-heading">Live HTTP Mode</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={liveMode}
                onChange={(e) => onLiveModeChange?.(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
            </label>
          </div>

          {liveMode && (
            <div className="space-y-3">
              <label className="bastion-field">
                <span>Target URL</span>
                <input
                  value={targetUrl}
                  onChange={(e) => onTargetUrlChange?.(e.target.value)}
                  className="bastion-input"
                  placeholder="http://localhost:10011/login"
                />
              </label>
              <div className="flex items-center gap-2 text-xs">
                {proxyReachable === true && (
                  <>
                    <Wifi size={14} className="text-emerald-400" />
                    <span className="text-emerald-400">Proxy connected &middot; Target reachable</span>
                  </>
                )}
                {proxyReachable === false && (
                  <>
                    <WifiOff size={14} className="text-red-400" />
                    <span className="text-red-400">Proxy unreachable &middot; Start servers first</span>
                  </>
                )}
                {proxyReachable === null && (
                  <span className="text-bastion-text-mid">Enable live mode to check connection</span>
                )}
              </div>
              <p className="text-xs text-bastion-text-mid">
                Real HTTP requests will be sent through the defense proxy to the target login server.
                Run <code className="text-bastion-accent-teal">node server/proxy.js</code> and <code className="text-bastion-accent-teal">node server/target.js</code> first.
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="bastion-primary-btn" onClick={onSave}>
            <Save size={15} />
            {t('scenario.actions.saveScenario')}
          </button>
          <button type="button" className="bastion-outline-btn" onClick={onRun}>
            <Play size={15} />
            {t('scenario.actions.runScenario')}
          </button>
          {isUnderAttack && (
            <button type="button" className="bastion-outline-btn" onClick={onStop}>
              <Square size={15} />
              {t('scenario.actions.stopScenario')}
            </button>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <div className="mt-6 rounded-xl border border-bastion-line bg-bastion-panel p-4">
          <h4 className="text-sm bastion-heading">{t('scenario.education.title')}</h4>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <article className="rounded-lg border border-bastion-line p-3 bg-gray-900/30">
              <div className="text-xs text-bastion-text-mid">{t('scenario.education.attackHeading')}</div>
              <div className="mt-1 text-sm text-bastion-text-high">{t(`scenario.attackType.${draft.attackType}`)}</div>
              <p className="mt-1 text-xs text-bastion-text-mid">
                {t(`scenario.attackDescription.${draft.attackType}`)}
              </p>
            </article>

            <article className="rounded-lg border border-bastion-line p-3 bg-gray-900/30">
              <div className="text-xs text-bastion-text-mid">{t('scenario.education.surfaceHeading')}</div>
              <div className="mt-1 text-sm text-bastion-text-high">{t(`scenario.targetSurface.${draft.targetSurface}`)}</div>
              <p className="mt-1 text-xs text-bastion-text-mid">
                {t(`scenario.surfaceDescription.${draft.targetSurface}`)}
              </p>
            </article>

            <article className="rounded-lg border border-bastion-line p-3 bg-gray-900/30">
              <div className="text-xs text-bastion-text-mid">{t('scenario.education.businessHeading')}</div>
              <div className="mt-1 text-sm text-bastion-text-high">{t(`scenario.businessProfile.${draft.businessProfile}`)}</div>
              <p className="mt-1 text-xs text-bastion-text-mid">
                {t(`scenario.businessDescription.${draft.businessProfile}`)}
              </p>
            </article>
          </div>
          {selectedAttackType && (
            <p className="mt-3 text-xs text-bastion-text-mid">
              {t('scenario.education.teacherNote')}
            </p>
          )}
        </div>
      </MotionDiv>

      <MotionAside
        className="glass-panel bastion-surface p-6 xl:col-span-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-lg bastion-heading">{t('scenario.risk.title')}</h3>
        <div className="mt-3 rounded-xl border border-bastion-line bg-bastion-panel px-4 py-3">
          <div className="text-xs text-bastion-text-mid">{t('common.labels.risk')}</div>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-2xl font-semibold text-bastion-accent-copper">{formatNumber(riskScore)}%</span>
            <span className="text-sm text-bastion-text-mid">{riskLabel}</span>
          </div>
        </div>

        <h4 className="mt-6 text-sm text-bastion-text-mid">{t('scenario.saved.title')}</h4>
        <div className="mt-2 max-h-64 overflow-auto custom-scrollbar space-y-2">
          {scenarios.length === 0 && (
            <p className="text-xs text-bastion-text-mid">{t('scenario.saved.empty')}</p>
          )}
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => onSelectScenario(scenario.id)}
              className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                scenario.id === selectedScenarioId
                  ? 'border-bastion-accent-copper bg-bastion-accent-copper/10'
                  : 'border-bastion-line bg-bastion-panel hover:border-bastion-accent-teal/60'
              }`}
            >
              <div className="text-sm text-bastion-text-high">{scenario.name}</div>
              <div className="text-xs text-bastion-text-mid">
                {t(`scenario.attackType.${scenario.attackType}`)} • {scenario.intensity}x
              </div>
            </button>
          ))}
        </div>
      </MotionAside>
    </section>
  );
};
