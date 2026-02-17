import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

/**
 * Alert Panel - Shows real-time security alerts
 */
export const AlertPanel = ({ alerts = [], onDismiss }) => {
  const getAlertStyle = (severity) => {
    switch (severity) {
      case 'critical':
        return { bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertTriangle, iconColor: 'text-red-500' };
      case 'warning':
        return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: AlertTriangle, iconColor: 'text-yellow-500' };
      case 'success':
        return { bg: 'bg-green-500/10', border: 'border-green-500/30', icon: CheckCircle, iconColor: 'text-green-500' };
      default:
        return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Info, iconColor: 'text-blue-500' };
    }
  };

  const formatTime = (timestamp) => {
    const d = new Date(timestamp);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
        <AlertTriangle size={16} /> Security Alerts
        <span className="ml-auto text-xs bg-gray-700 px-2 py-0.5 rounded-full">{alerts.length}</span>
      </h3>
      
      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {alerts.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-4">
              No alerts
            </div>
          ) : (
            alerts.map((alert, index) => {
              const style = getAlertStyle(alert.severity);
              const Icon = style.icon;
              
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-lg ${style.bg} border ${style.border} flex items-start gap-3`}
                >
                  <Icon size={16} className={`${style.iconColor} mt-0.5 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{alert.title}</span>
                      <span className="text-xs text-gray-500">{formatTime(alert.timestamp)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{alert.message}</p>
                  </div>
                  {onDismiss && (
                    <button 
                      onClick={() => onDismiss(alert.id)}
                      className="text-gray-500 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
