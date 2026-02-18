import { Activity, AlertTriangle, Clock, Lock, Shield, Users, Zap } from 'lucide-react';
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { AlertPanel } from './components/AlertPanel';
import { ControlPanelV2 } from './components/ControlPanelV2';
import { ServerHealth } from './components/ServerHealth';
import { StatCard } from './components/StatCard';
import { ThemeToggle } from './components/ThemeProvider';
import { ThreatGauge } from './components/ThreatGauge';
import { MetricsCollector } from './simulation/MetricsCollector';
import { ANALYTICS_WINDOW_MS, SimulationEngineV2 } from './simulation/SimulationEngineV2';

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

const PanelLoadingFallback = ({
  label = 'Loading panel...',
  heightClass = 'h-300',
}) => (
  <div className={`glass-panel p-4 ${heightClass} flex items-center justify-center`}>
    <span className="text-xs text-gray-500">{label}</span>
  </div>
);

function AppV2() {
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
  const lastChartSampleRef = useRef(0);

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

  const formatDuration = (ms) => {
    if (!ms) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const latestTelemetry = chartData[chartData.length - 1] || { rps: 0, blocked: 0, failed: 0 };

  return (
    <main className="min-h-screen p-4 md:p-6 font-sans">
      <div className="dashboard-shell mx-auto w-full max-w-7xl">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-text">
              Security Operations Center
            </h1>
            <p className="text-gray-500">Brute-Force Attack Simulation & Defense System v2</p>
            <p className="text-xs text-gray-500 mt-1">
              Unified telemetry window: {CHART_WINDOW_SECONDS}s
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Attack Type Badge */}
            {state.config.isUnderAttack && (
              <div className="px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 flex items-center gap-2">
                <span className="text-lg" aria-hidden="true">{state.attackType.icon}</span>
                <span className="text-danger text-sm font-medium">{state.attackType.name}</span>
              </div>
            )}

            {/* Status Indicator */}
            <div
              aria-live="polite"
              className={`px-4 py-2 rounded-full border flex items-center gap-2 ${
                state.config.isUnderAttack
                  ? 'border-red-500/30 bg-red-500/10 text-danger'
                  : 'border-green-500/30 bg-green-500/10 text-primary'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                state.config.isUnderAttack ? 'bg-red-500 animate-pulse' : 'bg-green-500'
              }`} />
              {state.config.isUnderAttack ? 'UNDER ATTACK' : 'SYSTEM SECURE'}
            </div>

            <div className="px-3 py-1 rounded-full border border-gray-700/50 bg-gray-800/50 text-xs text-gray-400">
              RPS {latestTelemetry.rps}
            </div>
            <div className="px-3 py-1 rounded-full border border-gray-700/50 bg-gray-800/50 text-xs text-gray-400">
              Blocked/s {latestTelemetry.blocked}
            </div>

            <ThemeToggle />

            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              Reset
            </button>
          </div>
        </header>

        <p className="text-xs text-gray-500 mb-2">Session Totals (since reset)</p>
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <StatCard title="Total Requests" value={state.stats.totalRequests.toLocaleString()} icon={Activity} color="#00b8ff" />
          <StatCard title="Blocked" value={state.stats.blockedRequests.toLocaleString()} icon={Shield} color="#ef4444" />
          <StatCard title="Failed Auth" value={state.stats.failedAuth.toLocaleString()} icon={AlertTriangle} color="#f59e0b" />
          <StatCard title="Successful" value={state.stats.successfulLogins.toLocaleString()} icon={Users} color="#22c55e" />
          <StatCard title="Banned IPs" value={state.blockedIps.length} icon={Lock} color="#8b5cf6" />
          <StatCard title="Locked Accounts" value={state.lockedAccounts.length} icon={Lock} color="#ec4899" />
          <StatCard title="Peak RPS" value={state.stats.peakRps} icon={Zap} color="#f97316" />
          <StatCard title="Attack Duration" value={formatDuration(state.stats.attackDuration)} icon={Clock} color="#06b6d4" />
        </section>

        <p className="text-xs text-gray-500 mb-2">Live Detection (rolling {CHART_WINDOW_SECONDS}s window)</p>
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

        <p className="text-xs text-gray-500 mb-2">Response Operations</p>
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

        {/* Defense Stats */}
        {state.defenseStats && (
          <section className="glass-panel p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <Shield size={16} /> Defense Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-center">
              <div className="p-2">
                <div className="text-xl font-bold text-blue-400">{state.defenseStats.rateLimitBlocks}</div>
                <div className="text-xs text-gray-500">Rate Limited</div>
              </div>
              <div className="p-2">
                <div className="text-xl font-bold text-red-400">{state.defenseStats.ipBans}</div>
                <div className="text-xs text-gray-500">IP Bans</div>
              </div>
              <div className="p-2">
                <div className="text-xl font-bold text-yellow-400">{state.defenseStats.accountLockouts}</div>
                <div className="text-xs text-gray-500">Lockouts</div>
              </div>
              <div className="p-2">
                <div className="text-xl font-bold text-green-400">{state.defenseStats.captchaChallenges}</div>
                <div className="text-xs text-gray-500">CAPTCHAs</div>
              </div>
              <div className="p-2">
                <div className="text-xl font-bold text-cyan-400">{state.defenseStats.geoBlocks}</div>
                <div className="text-xs text-gray-500">Geo-Blocks</div>
              </div>
              <div className="p-2">
                <div className="text-xl font-bold text-amber-400">{state.defenseStats.honeypotDetections}</div>
                <div className="text-xs text-gray-500">Honeypots</div>
              </div>
              <div className="p-2">
                <div className="text-xl font-bold text-pink-400">{state.defenseStats.behavioralBlocks}</div>
                <div className="text-xs text-gray-500">Bot Blocks</div>
              </div>
            </div>
          </section>
        )}

        <section>
          <Suspense fallback={<PanelLoadingFallback label="Loading traffic logs..." heightClass="h-400" />}>
            <LogTable logs={state.logs} />
          </Suspense>
        </section>
      </div>
    </main>
  );
}

export default AppV2;
