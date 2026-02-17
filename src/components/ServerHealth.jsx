import { Activity, Database, Shield, Wifi } from 'lucide-react';

const getMetricColor = (value, fallbackColor) => {
  if (value > 80) return '#ef4444';
  if (value > 60) return '#f59e0b';
  return fallbackColor;
};

const MetricBar = ({ label, value, color, icon: Icon }) => (
  <div className="flex items-center gap-2">
    <span className="w-16 text-xs text-gray-400 flex items-center gap-1">
      {Icon && <Icon size={12} />}
      {label}
    </span>
    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full metric-bar-fill"
        style={{ width: `${value}%`, backgroundColor: getMetricColor(value, color) }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-label={`${label} usage`}
      />
    </div>
    <span className="w-10 text-xs text-right font-mono" style={{ color: value > 80 ? '#ef4444' : '#fff' }}>
      {value}%
    </span>
  </div>
);

/**
 * Server Health Visualization
 * Shows server load, CPU, memory, and network with status indicators.
 */
export const ServerHealth = ({
  stats = {},
  isUnderAttack = false,
  threatLevel = 0,
}) => {
  const cpuLoad = Math.min(100, Math.round((stats.rps || 0) * 0.5 + threatLevel * 0.3));
  const memoryLoad = Math.min(100, Math.round(30 + threatLevel * 0.5));
  const networkLoad = Math.min(100, Math.round((stats.rps || 0) * 0.8));
  const connectionPool = Math.min(100, Math.round((stats.blockedIpCount || 0) * 5 + (stats.rps || 0) * 0.3));

  const getServerStatus = () => {
    if (cpuLoad > 90 || memoryLoad > 90) return { label: 'CRITICAL', color: '#ef4444' };
    if (cpuLoad > 70 || memoryLoad > 70) return { label: 'STRESSED', color: '#f59e0b' };
    if (cpuLoad > 50 || memoryLoad > 50) return { label: 'MODERATE', color: '#eab308' };
    return { label: 'HEALTHY', color: '#22c55e' };
  };

  const status = getServerStatus();
  const healthScore = Math.max(0, 100 - Math.round((cpuLoad + memoryLoad + networkLoad + connectionPool) / 4));

  return (
    <div className="glass-panel p-4">
      <div className="mb-4 flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-gray-400">Server Health</h3>
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-bold"
          style={{
            backgroundColor: `${status.color}20`,
            color: status.color,
          }}
        >
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-lg border border-gray-700/50 bg-gray-900/50 p-2">
          <div className="text-xs text-gray-500">Health Score</div>
          <div className="text-lg font-bold text-white">{healthScore}</div>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-900/50 p-2">
          <div className="text-xs text-gray-500">Threat Input</div>
          <div className="text-lg font-bold text-white">{threatLevel}%</div>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-900/50 p-2">
          <div className="text-xs text-gray-500">Live RPS</div>
          <div className="text-lg font-bold text-white">{stats.rps || 0}</div>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-900/50 p-2">
          <div className="text-xs text-gray-500">Blocked IPs</div>
          <div className="text-lg font-bold text-white">{stats.blockedIpCount || 0}</div>
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <div className={`relative health-core ${isUnderAttack ? 'server-shake' : ''}`}>
          <div
            className="w-24 h-32 rounded-lg border-2 flex flex-col justify-center items-center gap-1 p-2"
            style={{
              borderColor: status.color,
              boxShadow: `0 0 20px ${status.color}40`,
            }}
          >
            <div className="flex gap-1 mb-2">
              <div className={`w-2 h-2 rounded-full status-led ${isUnderAttack ? 'animate-pulse' : ''}`} style={{ backgroundColor: status.color }} />
              <div className={`w-2 h-2 rounded-full bg-blue-400 ${isUnderAttack ? 'animate-pulse' : ''}`} />
              <div className="w-2 h-2 rounded-full bg-gray-600" />
            </div>

            {[1, 2, 3].map((i) => (
              <div key={i} className="w-16 h-4 bg-gray-800 rounded flex items-center px-1 gap-1">
                <div className={`w-1.5 h-2 rounded-sm bg-green-400 ${isUnderAttack ? 'animate-pulse' : ''}`} />
                <div className="flex-1 h-1 bg-gray-700 rounded" />
              </div>
            ))}

            <div className="flex gap-0.5 mt-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="w-1 h-3 bg-gray-700 rounded-full" />
              ))}
            </div>
          </div>

          {isUnderAttack && (
            <>
              <div className="absolute -top-2 -left-2 w-4 h-4 attack-spark">⚡</div>
              <div className="absolute -top-2 -right-2 w-4 h-4 attack-spark attack-spark-delay">⚡</div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <MetricBar label="CPU" value={cpuLoad} color="#00b8ff" icon={Activity} />
        <MetricBar label="Memory" value={memoryLoad} color="#8b5cf6" icon={Database} />
        <MetricBar label="Network" value={networkLoad} color="#22c55e" icon={Wifi} />
        <MetricBar label="Conn Pool" value={connectionPool} color="#f59e0b" icon={Shield} />
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700/50 grid grid-cols-2 gap-2 text-center">
        <div>
          <div className="text-sm font-bold text-white">{Math.round(stats.avgResponseTime || 0)}ms</div>
          <div className="text-xs text-gray-500">Avg Response</div>
        </div>
        <div>
          <div className="text-sm font-bold text-white">{stats.activeConnections || 0}</div>
          <div className="text-xs text-gray-500">Active Conn</div>
        </div>
      </div>
    </div>
  );
};
