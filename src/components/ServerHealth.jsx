import { motion } from 'framer-motion';

/**
 * Server Health Visualization
 * Shows server load, CPU, memory, and network with animated indicators
 */
export const ServerHealth = ({ 
  stats = {},
  isUnderAttack = false,
  threatLevel = 0 
}) => {
  // Calculate health metrics based on stats
  const cpuLoad = Math.min(100, Math.round(stats.rps * 0.5 + threatLevel * 0.3));
  const memoryLoad = Math.min(100, Math.round(30 + threatLevel * 0.5));
  const networkLoad = Math.min(100, Math.round(stats.rps * 0.8));
  const connectionPool = Math.min(100, Math.round((stats.blockedIpCount || 0) * 5 + stats.rps * 0.3));
  
  // Determine server status
  const getServerStatus = () => {
    if (cpuLoad > 90 || memoryLoad > 90) return { label: 'CRITICAL', color: '#ef4444' };
    if (cpuLoad > 70 || memoryLoad > 70) return { label: 'STRESSED', color: '#f59e0b' };
    if (cpuLoad > 50 || memoryLoad > 50) return { label: 'MODERATE', color: '#eab308' };
    return { label: 'HEALTHY', color: '#22c55e' };
  };
  
  const status = getServerStatus();
  
  const MetricBar = ({ label, value, color = '#00b8ff', icon }) => (
    <div className="flex items-center gap-2">
      <span className="w-16 text-xs text-gray-400">{label}</span>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: value > 80 ? '#ef4444' : value > 60 ? '#f59e0b' : color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className="w-10 text-xs text-right font-mono" style={{ color: value > 80 ? '#ef4444' : '#fff' }}>
        {value}%
      </span>
    </div>
  );

  return (
    <div className="glass-panel p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
        🖥️ Server Health
      </h3>
      
      {/* Server Icon */}
      <div className="flex justify-center mb-4">
        <motion.div 
          className="relative"
          animate={isUnderAttack ? { 
            x: [0, -2, 2, -2, 2, 0],
          } : {}}
          transition={{ duration: 0.5, repeat: isUnderAttack ? Infinity : 0, repeatDelay: 0.5 }}
        >
          {/* Server rack visualization */}
          <div 
            className="w-24 h-32 rounded-lg border-2 flex flex-col justify-center items-center gap-1 p-2"
            style={{ 
              borderColor: status.color,
              boxShadow: `0 0 20px ${status.color}40`
            }}
          >
            {/* LED indicators */}
            <div className="flex gap-1 mb-2">
              <motion.div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: status.color }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.div 
                className="w-2 h-2 rounded-full bg-blue-400"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
              <div className="w-2 h-2 rounded-full bg-gray-600" />
            </div>
            
            {/* Drive bays */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-16 h-4 bg-gray-800 rounded flex items-center px-1 gap-1">
                <motion.div 
                  className="w-1.5 h-2 bg-green-400 rounded-sm"
                  animate={{ opacity: isUnderAttack ? [1, 0.3, 1] : 1 }}
                  transition={{ duration: 0.2, repeat: isUnderAttack ? Infinity : 0 }}
                />
                <div className="flex-1 h-1 bg-gray-700 rounded" />
              </div>
            ))}
            
            {/* Vents */}
            <div className="flex gap-0.5 mt-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="w-1 h-3 bg-gray-700 rounded-full" />
              ))}
            </div>
          </div>
          
          {/* Attack indicators */}
          {isUnderAttack && (
            <>
              <motion.div
                className="absolute -top-2 -left-2 w-4 h-4"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                ⚡
              </motion.div>
              <motion.div
                className="absolute -top-2 -right-2 w-4 h-4"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
              >
                ⚡
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
      
      {/* Status Badge */}
      <div className="text-center mb-4">
        <span 
          className="inline-block px-3 py-1 rounded-full text-xs font-bold"
          style={{ 
            backgroundColor: `${status.color}20`,
            color: status.color
          }}
        >
          {status.label}
        </span>
      </div>
      
      {/* Metrics */}
      <div className="space-y-3">
        <MetricBar label="CPU" value={cpuLoad} color="#00b8ff" />
        <MetricBar label="Memory" value={memoryLoad} color="#8b5cf6" />
        <MetricBar label="Network" value={networkLoad} color="#22c55e" />
        <MetricBar label="Conn Pool" value={connectionPool} color="#f59e0b" />
      </div>
      
      {/* Connection stats */}
      <div className="mt-4 pt-4 border-t border-gray-700/50 grid grid-cols-2 gap-2 text-center">
        <div>
          <div className="text-lg font-bold text-white">{stats.rps || 0}</div>
          <div className="text-xs text-gray-500">RPS</div>
        </div>
        <div>
          <div className="text-lg font-bold text-white">{stats.blockedIpCount || 0}</div>
          <div className="text-xs text-gray-500">Blocked IPs</div>
        </div>
      </div>
    </div>
  );
};
