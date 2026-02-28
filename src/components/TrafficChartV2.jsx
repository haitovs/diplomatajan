import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useI18n } from '../i18n/I18nProvider';

/**
 * Enhanced Traffic Chart with multiple data series
 */
export const TrafficChartV2 = ({
  data = [],
  showBlocked = true,
  showFailed = true,
  windowSeconds = 90,
  isUnderAttack = false,
}) => {
  const { t } = useI18n();
  const latest = data[data.length - 1] || { rps: 0, blocked: 0, failed: 0 };

  return (
    <div className="glass-panel p-6 h-300 flex flex-col">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-white">{t('dashboard.liveDetection')}</h2>
          <p className="text-xs text-gray-500">{t('dashboard.subtitle')}</p>
        </div>
        <span
          className={`rounded-full border px-2 py-1 text-xs ${
            isUnderAttack
              ? 'border-red-500/30 bg-red-500/10 text-red-400'
              : 'border-gray-700/50 bg-gray-800/50 text-gray-400'
          }`}
        >
          {windowSeconds}s window
        </span>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="flex-1 rounded-lg border border-gray-700/50 bg-gray-900/50 p-2">
          <div className="text-xs text-gray-500">{t('dashboard.telemetry.rps')}</div>
          <div className="text-sm font-bold text-white">{latest.rps}</div>
        </div>
        <div className="flex-1 rounded-lg border border-gray-700/50 bg-gray-900/50 p-2">
          <div className="text-xs text-gray-500">{t('dashboard.telemetry.blockedPerSec')}</div>
          <div className="text-sm font-bold text-red-400">{latest.blocked}</div>
        </div>
        <div className="flex-1 rounded-lg border border-gray-700/50 bg-gray-900/50 p-2">
          <div className="text-xs text-gray-500">{t('dashboard.telemetry.failedPerSec')}</div>
          <div className="text-sm font-bold text-yellow-400">{latest.failed}</div>
        </div>
      </div>
      
      <div className="flex-1 min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00b8ff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00b8ff" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="time" 
              stroke="#666"
              fontSize={12}
              tickLine={false}
              minTickGap={36}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #333',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span style={{ color: '#999', fontSize: '12px' }}>{value}</span>}
            />
            
            <Area 
                type="monotone" 
                dataKey="rps" 
                name={t('dashboard.telemetry.rps')}
                stroke="#00b8ff" 
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRps)"
            />
            
            {showBlocked && (
              <Area 
                type="monotone" 
                dataKey="blocked" 
                name={t('dashboard.telemetry.blockedPerSec')}
                stroke="#ef4444" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorBlocked)"
              />
            )}
            
            {showFailed && (
              <Area 
                type="monotone" 
                dataKey="failed" 
                name={t('dashboard.telemetry.failedPerSec')}
                stroke="#f59e0b" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorFailed)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>

        {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
            {t('common.states.noData')}
          </div>
        )}
      </div>
      
      {/* Legend toggles */}
      <div className="flex gap-4 mt-4 justify-center">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00b8ff' }} />
          <span className="text-gray-400">{t('dashboard.telemetry.rps')}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
          <span className="text-gray-400">{t('dashboard.stats.blocked')}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
          <span className="text-gray-400">{t('dashboard.stats.failedAuth')}</span>
        </div>
      </div>
    </div>
  );
};
