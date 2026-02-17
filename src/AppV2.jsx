import { Activity, AlertTriangle, Clock, Lock, Shield, Users, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AlertPanel } from './components/AlertPanel';
import { AttackMap } from './components/AttackMap';
import { ControlPanelV2 } from './components/ControlPanelV2';
import { LogTable } from './components/LogTable';
import { ServerHealth } from './components/ServerHealth';
import { StatCard } from './components/StatCard';
import { ThemeToggle } from './components/ThemeProvider';
import { ThreatGauge } from './components/ThreatGauge';
import { TrafficChartV2 } from './components/TrafficChartV2';
import { MetricsCollector } from './simulation/MetricsCollector';
import { SimulationEngineV2 } from './simulation/SimulationEngineV2';

// Initialize engine and metrics collector
const engine = new SimulationEngineV2();
const metricsCollector = new MetricsCollector();

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
  });
  
  const [chartData, setChartData] = useState([]);
  const [threatLevel, setThreatLevel] = useState({ level: 0, label: 'MINIMAL', color: '#6366f1' });

  useEffect(() => {
    engine.start();
    
    const unsubscribe = engine.subscribe((data) => {
      setState(data);
      
      // Update metrics collector
      metricsCollector.update(data);
      
      // Update chart data
      const metrics = metricsCollector.getCurrent();
      setChartData(prev => {
        const newData = [...prev, { 
          time: new Date().toLocaleTimeString(), 
          rps: metrics.rps,
          blocked: metrics.blockedPerSecond,
          failed: metrics.failedAuthPerSecond,
        }];
        if (newData.length > 30) newData.shift();
        return newData;
      });
      
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
    setChartData([]);
  }, []);

  const formatDuration = (ms) => {
    if (!ms) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="min-h-screen p-6 text-white font-sans">
      {/* Header */}
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-text">
            Security Operations Center
          </h1>
          <p className="text-gray-500">Brute-Force Attack Simulation & Defense System v2</p>
        </div>
        <div className="flex gap-4 items-center">
          {/* Attack Type Badge */}
          {state.config.isUnderAttack && (
            <div className="px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 flex items-center gap-2">
              <span className="text-lg">{state.attackType.icon}</span>
              <span className="text-danger text-sm font-medium">{state.attackType.name}</span>
            </div>
          )}
          
          {/* Status Indicator */}
          <div className={`px-4 py-2 rounded-full border flex items-center gap-2 ${
            state.config.isUnderAttack 
              ? 'border-red-500/30 bg-red-500/10 text-danger' 
              : 'border-green-500/30 bg-green-500/10 text-primary'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              state.config.isUnderAttack ? 'bg-red-500 animate-pulse' : 'bg-green-500'
            }`} />
            {state.config.isUnderAttack ? 'UNDER ATTACK' : 'SYSTEM SECURE'}
          </div>
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Reset Button */}
          <button 
            onClick={handleReset}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            ↺ Reset
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
        <StatCard title="Total Requests" value={state.stats.totalRequests.toLocaleString()} icon={Activity} color="#00b8ff" />
        <StatCard title="Blocked" value={state.stats.blockedRequests.toLocaleString()} icon={Shield} color="#ef4444" />
        <StatCard title="Failed Auth" value={state.stats.failedAuth.toLocaleString()} icon={AlertTriangle} color="#f59e0b" />
        <StatCard title="Successful" value={state.stats.successfulLogins.toLocaleString()} icon={Users} color="#22c55e" />
        <StatCard title="Banned IPs" value={state.blockedIps.length} icon={Lock} color="#8b5cf6" />
        <StatCard title="Locked Accounts" value={state.lockedAccounts.length} icon={Lock} color="#ec4899" />
        <StatCard title="Peak RPS" value={state.stats.peakRps} icon={Zap} color="#f97316" />
        <StatCard title="Attack Duration" value={formatDuration(state.stats.attackDuration)} icon={Clock} color="#06b6d4" />
      </div>

      {/* Main Grid - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {/* Traffic Chart - 2 cols */}
        <div className="lg:col-span-2">
          <TrafficChartV2 data={chartData} />
        </div>
        
        {/* Attack Map */}
        <div>
          <AttackMap 
            attacks={state.logs.filter(l => l.type === 'ATTACK')}
            isUnderAttack={state.config.isUnderAttack}
          />
        </div>
        
        {/* Server Health */}
        <div>
          <ServerHealth 
            stats={state.stats}
            isUnderAttack={state.config.isUnderAttack}
            threatLevel={threatLevel.level}
          />
        </div>
      </div>
      
      {/* Main Grid - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {/* Threat Gauge */}
        <div>
          <ThreatGauge 
            level={threatLevel.level} 
            label={threatLevel.label} 
            color={threatLevel.color} 
          />
        </div>
        
        {/* Alerts */}
        <div>
          <AlertPanel alerts={state.alerts} />
        </div>
        
        {/* Control Panel - 2 cols */}
        <div className="lg:col-span-2">
          <ControlPanelV2 
            config={state.config}
            defenses={state.defenses}
            onToggleAttack={handleToggleAttack}
            onSetIntensity={handleSetIntensity}
            onSetAttackType={handleSetAttackType}
            onToggleDefense={handleToggleDefense}
          />
        </div>
      </div>

      {/* Defense Stats */}
      {state.defenseStats && (
        <div className="glass-panel p-4 mb-6">
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
        </div>
      )}

      {/* Log Table */}
      <div className="grid grid-cols-1 gap-6">
        <LogTable logs={state.logs} />
      </div>
    </div>
  );
}

export default AppV2;
