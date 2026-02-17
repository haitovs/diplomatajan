import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useMemo } from 'react';

/**
 * Alert Panel - Shows real-time security alerts
 */
export const AlertPanel = ({ alerts = [], onDismiss }) => {
  const orderedAlerts = useMemo(
    () => alerts.slice().sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)),
    [alerts],
  );

  const alertCounts = useMemo(
    () => orderedAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {}),
    [orderedAlerts],
  );

  const getAlertStyle = (severity) => {
    switch (severity) {
      case 'critical':
        return { bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertTriangle, iconColor: 'text-red-500', label: 'CRITICAL' };
      case 'warning':
        return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: AlertTriangle, iconColor: 'text-yellow-500', label: 'WARNING' };
      case 'success':
        return { bg: 'bg-green-500/10', border: 'border-green-500/30', icon: CheckCircle, iconColor: 'text-green-500', label: 'RESOLVED' };
      default:
        return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Info, iconColor: 'text-blue-500', label: 'INFO' };
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--:--';
    const d = new Date(timestamp);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel p-4">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <AlertTriangle size={16} /> Security Alerts
        </h3>
        <span className="ml-auto text-xs bg-gray-700 px-2 py-0.5 rounded-full">{orderedAlerts.length}</span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-red-400">
          Critical {alertCounts.critical || 0}
        </span>
        <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-yellow-500">
          Warning {alertCounts.warning || 0}
        </span>
        <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-green-400">
          Resolved {alertCounts.success || 0}
        </span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar" aria-live="polite">
        {orderedAlerts.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">
            No alerts
          </div>
        ) : (
          orderedAlerts.map((alert) => {
            const style = getAlertStyle(alert.severity);
            const Icon = style.icon;

            return (
              <div
                key={alert.id}
                className={`p-3 rounded-lg ${style.bg} border ${style.border} flex items-start gap-3`}
              >
                <Icon size={16} className={`${style.iconColor} mt-0.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${style.border} ${style.iconColor}`}>
                      {style.label}
                    </span>
                    <span className="text-xs text-gray-500">{formatTime(alert.timestamp)}</span>
                  </div>
                  <div className="text-sm font-medium text-white truncate">{alert.title}</div>
                  <p className="text-xs text-gray-400 mt-0.5 alert-message">{alert.message}</p>
                </div>
                {onDismiss && (
                  <button
                    type="button"
                    onClick={() => onDismiss(alert.id)}
                    className="text-gray-500 hover:text-white transition-colors"
                    aria-label={`Dismiss alert ${alert.title}`}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
