import {
  Activity,
  AlertTriangle,
  Clock,
  Lock,
  Shield,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react';
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertPanel } from './components/AlertPanel';
import { BastionNav } from './components/BastionNav';
import { ComparisonView } from './components/ComparisonView';
import { ControlPanelV2 } from './components/ControlPanelV2';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { RecommendationsPanel } from './components/RecommendationsPanel';
import { ReportExporter } from './components/ReportExporter';
import { ScenarioComposer } from './components/ScenarioComposer';
import { GuidePage } from './components/GuidePage';
import { ServerHealth } from './components/ServerHealth';
import { StatCard } from './components/StatCard';
import { ThemeToggle } from './components/ThemeProvider';
import { ThreatGauge } from './components/ThreatGauge';
import { useI18n } from './i18n/I18nProvider';
import { MetricsCollector } from './simulation/MetricsCollector';
import { ANALYTICS_WINDOW_MS, ATTACK_TYPES, SimulationEngineV2 } from './simulation/SimulationEngineV2';

const TrafficChartV2 = lazy(() =>
  import('./components/TrafficChartV2').then((module) => ({ default: module.TrafficChartV2 })),
);
const AttackMap = lazy(() =>
  import('./components/AttackMap').then((module) => ({ default: module.AttackMap })),
);
const LogTable = lazy(() =>
  import('./components/LogTable').then((module) => ({ default: module.LogTable })),
);

// Initialize engine and metrics collector
const engine = new SimulationEngineV2();
const metricsCollector = new MetricsCollector();
const MAP_WINDOW_MS = ANALYTICS_WINDOW_MS;
const CHART_WINDOW_SECONDS = Math.round(ANALYTICS_WINDOW_MS / 1000);
const CHART_SAMPLE_INTERVAL_MS = 1000;
const SCENARIO_STORAGE_KEY = 'bastion-scenarios-v1';
const VIEW_STORAGE_KEY = 'bastion-active-view-v1';
const DEFAULT_VIEW = 'workspace';
const ATTACK_TYPE_LIST = Object.values(ATTACK_TYPES);
const VALID_VIEWS = new Set(['workspace', 'scenario', 'defense', 'comparison', 'reports', 'guide']);

const createInitialScenarioDraft = () => ({
  id: null,
  name: '',
  attackType: ATTACK_TYPE_LIST[0]?.id || 'dictionary',
  intensity: 8,
  targetSurface: 'login',
  businessProfile: 'saas',
  defenses: [],
});

const defenseMapToConfigList = (defenseMap = {}) =>
  Object.values(defenseMap).map((defense) => ({
    id: defense.id,
    enabled: defense.enabled,
    params: { ...(defense.config || {}) },
  }));

const applyScenarioToEngine = (scenarioConfig) => {
  if (!scenarioConfig) return;
  engine.setAttackType(scenarioConfig.attackType);
  engine.setAttackIntensity(scenarioConfig.intensity);

  (scenarioConfig.defenses || []).forEach((defense) => {
    engine.toggleDefense(defense.id, Boolean(defense.enabled));
    if (defense.params && typeof defense.params === 'object') {
      engine.updateDefenseConfig(defense.id, defense.params);
    }
  });
};

const estimateScenarioRisk = ({ intensity, attackType, defenses }) => {
  const typeMeta = ATTACK_TYPE_LIST.find((type) => type.id === attackType);
  const enabledDefenses = defenses.filter((defense) => defense.enabled).length;
  const profileWeight = (typeMeta?.avgRps || 10) * 0.8 + (typeMeta?.successRate || 0.01) * 500;
  const intensityWeight = intensity * 3.5;
  const mitigation = enabledDefenses * 4.2;
  return Math.max(0, Math.min(100, Math.round(profileWeight + intensityWeight - mitigation)));
};

const buildRecommendations = ({ defenses, intensity, blockedRate }) => {
  const recommendationSeed = [];
  const enabledMap = defenses.reduce((acc, defense) => {
    acc[defense.id] = defense.enabled;
    return acc;
  }, {});

  if (!enabledMap.rate_limit) {
    recommendationSeed.push({
      id: 'rec-rate-limit',
      severity: 'critical',
      actionKey: 'enable_rate_limit',
      expectedRiskDropPct: 24,
      implementationEffort: 'low',
    });
  }
  if (!enabledMap.ip_blacklist) {
    recommendationSeed.push({
      id: 'rec-ip-blacklist',
      severity: 'high',
      actionKey: 'enable_ip_blacklist',
      expectedRiskDropPct: 17,
      implementationEffort: 'low',
    });
  }
  if (!enabledMap.account_lockout) {
    recommendationSeed.push({
      id: 'rec-account-lockout',
      severity: 'high',
      actionKey: 'enable_account_lockout',
      expectedRiskDropPct: 14,
      implementationEffort: 'medium',
    });
  }
  if (!enabledMap.behavioral && intensity >= 10) {
    recommendationSeed.push({
      id: 'rec-behavioral',
      severity: 'medium',
      actionKey: 'enable_behavioral',
      expectedRiskDropPct: 11,
      implementationEffort: 'high',
    });
  }
  if (!enabledMap.geo_blocking) {
    recommendationSeed.push({
      id: 'rec-geo-blocking',
      severity: 'medium',
      actionKey: 'enable_geo_blocking',
      expectedRiskDropPct: 8,
      implementationEffort: 'low',
    });
  }
  if (blockedRate < 30 || intensity >= 14) {
    recommendationSeed.push({
      id: 'rec-intensity-controls',
      severity: 'medium',
      actionKey: 'tighten_intensity_controls',
      expectedRiskDropPct: 13,
      implementationEffort: 'medium',
    });
  }

  return recommendationSeed.slice(0, 6);
};

const PanelLoadingFallback = ({
  label = 'Loading panel...',
  heightClass = 'h-300',
}) => (
  <div className={`glass-panel p-4 ${heightClass} flex items-center justify-center`}>
    <span className="text-xs text-gray-500">{label}</span>
  </div>
);

function AppV2() {
  const { t, formatNumber } = useI18n();

  const [state, setState] = useState({
    stats: engine.getStats(),
    config: engine.getConfig(),
    defenses: engine.defenseManager.getDefenses(),
    logs: [],
    alerts: [],
    blockedIps: [],
    lockedAccounts: [],
    attackType: engine.attackGenerator.getAttackType(),
    attackTelemetry: engine.getAttackTelemetrySnapshot(),
  });
  
  const [chartData, setChartData] = useState([]);
  const [threatLevel, setThreatLevel] = useState({ level: 0, label: 'MINIMAL', color: '#6366f1' });
  const [activeView, setActiveView] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_VIEW;
    const savedView = window.localStorage.getItem(VIEW_STORAGE_KEY);
    return savedView && VALID_VIEWS.has(savedView) ? savedView : DEFAULT_VIEW;
  });
  const [scenarioDraft, setScenarioDraft] = useState(() => ({
    ...createInitialScenarioDraft(),
    attackType: engine.getConfig().attackType,
    intensity: engine.getConfig().attackIntensity,
    defenses: defenseMapToConfigList(engine.defenseManager.getDefenses()),
  }));
  const [savedScenarios, setSavedScenarios] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const savedValue = window.localStorage.getItem(SCENARIO_STORAGE_KEY);
      if (!savedValue) return [];
      const parsed = JSON.parse(savedValue);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [scenarioError, setScenarioError] = useState('');
  const [baselineSnapshot, setBaselineSnapshot] = useState(null);
  const [hardenedSnapshot, setHardenedSnapshot] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const lastChartSampleRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(savedScenarios));
  }, [savedScenarios]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const viewToPersist = VALID_VIEWS.has(activeView) ? activeView : DEFAULT_VIEW;
    window.localStorage.setItem(VIEW_STORAGE_KEY, viewToPersist);
  }, [activeView]);

  useEffect(() => {
    engine.start();
    
    const unsubscribe = engine.subscribe((data) => {
      setState(data);
      
      // Update metrics collector
      metricsCollector.update(data);
      
      // Update chart data
      const metrics = metricsCollector.getCurrent();
      const timestamp = Number.isFinite(metrics.timestamp) ? metrics.timestamp : Date.now();
      if (timestamp - lastChartSampleRef.current >= CHART_SAMPLE_INTERVAL_MS) {
        lastChartSampleRef.current = timestamp;
        setChartData(prev => {
          const newData = [...prev, {
            time: new Date(timestamp).toLocaleTimeString(),
            rps: metrics.rps,
            blocked: metrics.blockedPerSecond,
            failed: metrics.failedAuthPerSecond,
          }];
          if (newData.length > CHART_WINDOW_SECONDS) newData.shift();
          return newData;
        });
      }
      
      // Update threat level
      setThreatLevel({
        level: metricsCollector.getThreatLevel(),
        ...metricsCollector.getThreatLabel(),
      });
    });

    return () => {
      engine.stop();
      unsubscribe();
    };
  }, []);

  // Handlers
  const handleToggleAttack = useCallback((val) => engine.toggleAttack(val), []);
  const handleSetIntensity = useCallback((val) => engine.setAttackIntensity(val), []);
  const handleSetAttackType = useCallback((val) => engine.setAttackType(val), []);
  const handleToggleDefense = useCallback((id, val) => engine.toggleDefense(id, val), []);
  const handleReset = useCallback(() => { 
    engine.reset(); 
    metricsCollector.reset();
    lastChartSampleRef.current = 0;
    setChartData([]);
  }, []);

  const handleScenarioDraftChange = useCallback((patch) => {
    setScenarioDraft((current) => ({ ...current, ...patch }));
    if (scenarioError) setScenarioError('');
  }, [scenarioError]);

  const handleSaveScenario = useCallback(() => {
    if (!scenarioDraft.name.trim()) {
      setScenarioError(t('errors.missingScenarioName'));
      return;
    }

    const scenarioToPersist = {
      ...scenarioDraft,
      id: scenarioDraft.id || `scenario-${Date.now()}`,
      defenses: defenseMapToConfigList(state.defenses),
      updatedAt: Date.now(),
    };

    setSavedScenarios((current) => {
      const existingIndex = current.findIndex((scenario) => scenario.id === scenarioToPersist.id);
      if (existingIndex === -1) return [scenarioToPersist, ...current];

      const copy = current.slice();
      copy[existingIndex] = scenarioToPersist;
      return copy;
    });

    setSelectedScenarioId(scenarioToPersist.id);
    setScenarioDraft((current) => ({ ...current, id: scenarioToPersist.id }));
    setScenarioError('');
  }, [scenarioDraft, state.defenses, t]);

  const handleSelectScenario = useCallback((scenarioId) => {
    const scenario = savedScenarios.find((item) => item.id === scenarioId);
    if (!scenario) return;

    setSelectedScenarioId(scenarioId);
    setScenarioDraft({ ...scenario });
    applyScenarioToEngine(scenario);
  }, [savedScenarios]);

  const handleRunScenario = useCallback(() => {
    const activeScenario = {
      ...scenarioDraft,
      defenses: defenseMapToConfigList(state.defenses),
    };
    applyScenarioToEngine(activeScenario);
    engine.toggleAttack(true);
    setActiveView('workspace');
  }, [scenarioDraft, state.defenses]);

  const handleTakeSnapshot = useCallback((label) => {
    const snapshot = {
      label,
      ts: Date.now(),
      totalRequests: state.stats.totalRequests,
      blockedRequests: state.stats.blockedRequests,
      failedAuth: state.stats.failedAuth,
      successfulLogins: state.stats.successfulLogins,
      peakRps: state.stats.peakRps,
      attackDuration: state.stats.attackDuration,
      defenseStats: state.defenseStats || {},
    };
    if (label === 'baseline') setBaselineSnapshot(snapshot);
    if (label === 'hardened') setHardenedSnapshot(snapshot);
  }, [state.defenseStats, state.stats]);

  const handleGenerateRecommendations = useCallback(() => {
    const defenses = defenseMapToConfigList(state.defenses);
    const blockedRate = state.stats.totalRequests
      ? Math.round((state.stats.blockedRequests / state.stats.totalRequests) * 100)
      : 0;
    const next = buildRecommendations({
      defenses,
      intensity: state.config.attackIntensity,
      blockedRate,
    });
    setRecommendations(next);
  }, [state.config.attackIntensity, state.defenses, state.stats.blockedRequests, state.stats.totalRequests]);

  const handleApplyPreset = useCallback((presetType) => {
    const enableDefense = (id) => engine.toggleDefense(id, true);
    const disableDefense = (id) => engine.toggleDefense(id, false);

    if (presetType === 'balanced') {
      ['rate_limit', 'ip_blacklist', 'captcha', 'account_lockout'].forEach(enableDefense);
      ['behavioral', 'geo_blocking', 'honeypot', 'progressive_delay'].forEach(disableDefense);
      return;
    }

    if (presetType === 'strict') {
      ['rate_limit', 'ip_blacklist', 'captcha', 'account_lockout', 'behavioral', 'geo_blocking', 'honeypot', 'progressive_delay']
        .forEach(enableDefense);
    }
  }, []);

  const formatDuration = (ms) => {
    if (!ms) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const latestTelemetry = chartData[chartData.length - 1] || { rps: 0, blocked: 0, failed: 0 };
  const scenarioRiskScore = useMemo(
    () => estimateScenarioRisk({
      intensity: scenarioDraft.intensity,
      attackType: scenarioDraft.attackType,
      defenses: defenseMapToConfigList(state.defenses),
    }),
    [scenarioDraft.attackType, scenarioDraft.intensity, state.defenses],
  );

  const selectedScenario = selectedScenarioId
    ? savedScenarios.find((scenario) => scenario.id === selectedScenarioId)
    : null;
  const safeActiveView = VALID_VIEWS.has(activeView) ? activeView : DEFAULT_VIEW;

  return (
    <main className="min-h-screen p-4 md:p-6 font-sans bastion-app">
      <div className="dashboard-shell mx-auto w-full max-w-7xl">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-text bastion-heading">
              {t('common.appName')}
            </h1>
            <p className="text-bastion-text-mid">{t('common.tagline')}</p>
            <p className="text-xs text-bastion-text-mid mt-1">
              {t('common.labels.window')}: {CHART_WINDOW_SECONDS}s
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center bastion-toolbar">
            {/* Attack Type Badge */}
            {state.config.isUnderAttack && (
              <div className="px-4 py-2 rounded-full bastion-chip bastion-chip-danger flex items-center gap-2">
                <span className="text-lg" aria-hidden="true">{state.attackType.icon}</span>
                <span className="text-danger text-sm font-medium">{state.attackType.name}</span>
              </div>
            )}

            {/* Status Indicator */}
            <div
              aria-live="polite"
              className={`px-4 py-2 rounded-full border flex items-center gap-2 bastion-status-chip ${
                state.config.isUnderAttack ? 'is-danger' : 'is-secure'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                state.config.isUnderAttack ? 'bastion-dot-danger animate-pulse' : 'bastion-dot-secure'
              }`} />
              {state.config.isUnderAttack ? t('common.states.underAttack') : t('common.states.secure')}
            </div>

            <div className="px-3 py-1 rounded-full border bastion-metric-pill text-xs text-bastion-text-mid">
              {t('dashboard.telemetry.rps')} {formatNumber(latestTelemetry.rps)}
            </div>
            <div className="px-3 py-1 rounded-full border bastion-metric-pill text-xs text-bastion-text-mid">
              {t('dashboard.telemetry.blockedPerSec')} {formatNumber(latestTelemetry.blocked)}
            </div>

            <LanguageSwitcher />
            <ThemeToggle />

            <button
              type="button"
              onClick={handleReset}
              className="bastion-outline-btn"
            >
              {t('common.actions.reset')}
            </button>
          </div>
        </header>

        <BastionNav activeView={safeActiveView} onChange={setActiveView} />

        <div className="bastion-view-shell">
          {safeActiveView === 'workspace' && (
            <>
            <p className="text-xs text-bastion-text-mid mb-2">{t('dashboard.sessionTotals')}</p>
            <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
              <StatCard title={t('dashboard.stats.totalRequests')} value={formatNumber(state.stats.totalRequests)} icon={Activity} color="#1fa89a" />
              <StatCard title={t('dashboard.stats.blocked')} value={formatNumber(state.stats.blockedRequests)} icon={Shield} color="#d9382c" />
              <StatCard title={t('dashboard.stats.failedAuth')} value={formatNumber(state.stats.failedAuth)} icon={AlertTriangle} color="#e2a33b" />
              <StatCard title={t('dashboard.stats.successful')} value={formatNumber(state.stats.successfulLogins)} icon={Users} color="#1fa89a" />
              <StatCard title={t('dashboard.stats.bannedIps')} value={formatNumber(state.blockedIps.length)} icon={Lock} color="#c66b3d" />
              <StatCard title={t('dashboard.stats.lockedAccounts')} value={formatNumber(state.lockedAccounts.length)} icon={Lock} color="#e2a33b" />
              <StatCard title={t('dashboard.stats.peakRps')} value={formatNumber(state.stats.peakRps)} icon={Zap} color="#c66b3d" />
              <StatCard title={t('dashboard.stats.attackDuration')} value={formatDuration(state.stats.attackDuration)} icon={Clock} color="#1fa89a" />
            </section>

            <div className="mb-6 flex flex-wrap gap-3">
              <button type="button" className="bastion-outline-btn" onClick={() => handleTakeSnapshot('baseline')}>
                <ShieldCheck size={15} />
                {t('common.actions.snapshotBaseline')}
              </button>
              <button type="button" className="bastion-outline-btn" onClick={() => handleTakeSnapshot('hardened')}>
                <ShieldCheck size={15} />
                {t('common.actions.snapshotHardened')}
              </button>
            </div>

            <p className="text-xs text-bastion-text-mid mb-2">{t('dashboard.liveDetection')} ({CHART_WINDOW_SECONDS}s)</p>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="md:col-span-2 lg:col-span-2 min-w-0">
                <Suspense fallback={<PanelLoadingFallback label="Loading traffic telemetry..." heightClass="h-300" />}>
                  <TrafficChartV2
                    data={chartData}
                    windowSeconds={CHART_WINDOW_SECONDS}
                    isUnderAttack={state.config.isUnderAttack}
                  />
                </Suspense>
              </div>

              <div className="min-w-0">
                <Suspense fallback={<PanelLoadingFallback label="Loading origin telemetry map..." heightClass="h-64" />}>
                  <AttackMap
                    telemetry={state.attackTelemetry}
                    isUnderAttack={state.config.isUnderAttack}
                    windowMs={MAP_WINDOW_MS}
                    activeAttackTypeId={state.config.attackType}
                  />
                </Suspense>
              </div>

              <div className="min-w-0">
                <ServerHealth
                  stats={state.stats}
                  isUnderAttack={state.config.isUnderAttack}
                  threatLevel={threatLevel.level}
                />
              </div>
            </section>

            <p className="text-xs text-bastion-text-mid mb-2">{t('dashboard.responseOps')}</p>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="min-w-0 space-y-6">
                <ThreatGauge
                  level={threatLevel.level}
                  label={threatLevel.label}
                  color={threatLevel.color}
                />

                <AlertPanel alerts={state.alerts} />
              </div>

              <div className="min-w-0 lg:col-span-2">
                <ControlPanelV2
                  config={state.config}
                  defenses={state.defenses}
                  onToggleAttack={handleToggleAttack}
                  onSetIntensity={handleSetIntensity}
                  onSetAttackType={handleSetAttackType}
                  onToggleDefense={handleToggleDefense}
                />
              </div>
            </section>

            {state.defenseStats && (
              <section className="glass-panel bastion-surface p-4 mb-6">
                <h3 className="text-sm font-medium text-bastion-text-mid mb-3 flex items-center gap-2">
                  <Shield size={16} /> {t('dashboard.defenseStats.title')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-center">
                  <div className="p-2">
                    <div className="text-xl font-bold text-blue-400">{state.defenseStats.rateLimitBlocks}</div>
                    <div className="text-xs text-bastion-text-mid">{t('dashboard.defenseStats.rateLimited')}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-xl font-bold text-red-400">{state.defenseStats.ipBans}</div>
                    <div className="text-xs text-bastion-text-mid">{t('dashboard.defenseStats.ipBans')}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-xl font-bold text-yellow-400">{state.defenseStats.accountLockouts}</div>
                    <div className="text-xs text-bastion-text-mid">{t('dashboard.defenseStats.lockouts')}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-xl font-bold text-green-400">{state.defenseStats.captchaChallenges}</div>
                    <div className="text-xs text-bastion-text-mid">{t('dashboard.defenseStats.captchas')}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-xl font-bold text-cyan-400">{state.defenseStats.geoBlocks}</div>
                    <div className="text-xs text-bastion-text-mid">{t('dashboard.defenseStats.geoBlocks')}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-xl font-bold text-amber-400">{state.defenseStats.honeypotDetections}</div>
                    <div className="text-xs text-bastion-text-mid">{t('dashboard.defenseStats.honeypots')}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-xl font-bold text-pink-400">{state.defenseStats.behavioralBlocks}</div>
                    <div className="text-xs text-bastion-text-mid">{t('dashboard.defenseStats.botBlocks')}</div>
                  </div>
                </div>
              </section>
            )}

            <section>
              <Suspense fallback={<PanelLoadingFallback label="Loading traffic logs..." heightClass="h-400" />}>
                <LogTable logs={state.logs} />
              </Suspense>
            </section>
            </>
          )}

          {safeActiveView === 'scenario' && (
            <ScenarioComposer
              attackTypes={ATTACK_TYPE_LIST}
              draft={scenarioDraft}
              riskScore={scenarioRiskScore}
              scenarios={savedScenarios}
              selectedScenarioId={selectedScenarioId}
              onDraftChange={handleScenarioDraftChange}
              onSave={handleSaveScenario}
              onRun={handleRunScenario}
              onSelectScenario={handleSelectScenario}
              error={scenarioError}
            />
          )}

          {safeActiveView === 'defense' && (
            <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <ControlPanelV2
                  config={state.config}
                  defenses={state.defenses}
                  onToggleAttack={handleToggleAttack}
                  onSetIntensity={handleSetIntensity}
                  onSetAttackType={handleSetAttackType}
                  onToggleDefense={handleToggleDefense}
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" className="bastion-outline-btn" onClick={() => handleApplyPreset('balanced')}>
                    {t('defense.actions.applyPresetBalanced')}
                  </button>
                  <button type="button" className="bastion-outline-btn" onClick={() => handleApplyPreset('strict')}>
                    {t('defense.actions.applyPresetStrict')}
                  </button>
                  <button type="button" className="bastion-primary-btn" onClick={handleGenerateRecommendations}>
                    {t('defense.actions.generateRecommendations')}
                  </button>
                </div>
              </div>
              <div className="lg:col-span-2">
                <RecommendationsPanel items={recommendations} />
              </div>
            </section>
          )}

          {safeActiveView === 'comparison' && (
            <ComparisonView baselineSnapshot={baselineSnapshot} hardenedSnapshot={hardenedSnapshot} />
          )}

          {safeActiveView === 'reports' && (
            <ReportExporter
              scenario={selectedScenario || scenarioDraft}
              baselineSnapshot={baselineSnapshot}
              hardenedSnapshot={hardenedSnapshot}
              recommendations={recommendations}
            />
          )}

          {safeActiveView === 'guide' && <GuidePage />}
        </div>
      </div>
    </main>
  );
}

export default AppV2;
