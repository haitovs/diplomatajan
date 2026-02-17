import { useMemo, useState } from 'react';

const formatTime = (timestamp) => {
  if (!timestamp) return '--:--:--';
  return new Date(timestamp).toLocaleTimeString();
};

const isBlockedStatus = (status) => [403, 423, 428, 429].includes(status);

const getStatusBadgeClasses = (status) => {
  if (status === 200) return 'border-green-500/30 bg-green-500/10 text-green-400';
  if (status === 401) return 'border-red-500/30 bg-red-500/10 text-red-400';
  if (isBlockedStatus(status)) return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500';
  return 'border-gray-700/50 bg-gray-800/50 text-gray-400';
};

export const LogTable = ({ logs = [] }) => {
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  const normalizedSearch = search.trim().toLowerCase();
  const visibleLogs = useMemo(() => logs.slice().reverse().filter((log) => {
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'attack' && log.type === 'ATTACK') ||
      (typeFilter === 'blocked' && isBlockedStatus(log.status)) ||
      (typeFilter === 'failed' && log.status === 401) ||
      (typeFilter === 'success' && log.status === 200);

    if (!matchesType) return false;
    if (!normalizedSearch) return true;

    return [
      log.ip,
      log.path,
      log.message,
      log.type,
      String(log.status),
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch);
  }), [logs, typeFilter, normalizedSearch]);

  return (
    <div className="glass-panel p-6 h-400 flex flex-col">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-xl font-bold text-white">Traffic Logs</h2>
        <span className="ml-auto text-xs text-gray-500">{visibleLogs.length} visible</span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {[
          ['all', 'All'],
          ['attack', 'Attack'],
          ['blocked', 'Blocked'],
          ['failed', 'Failed'],
          ['success', 'Success'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTypeFilter(id)}
            aria-pressed={typeFilter === id}
            className={`rounded-full border px-2 py-1 text-xs transition-colors ${
              typeFilter === id
                ? 'border-blue-500/30 bg-blue-500/10 text-blue-500'
                : 'border-gray-700/50 bg-gray-800/50 text-gray-400 hover:border-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-lg border border-gray-700/50 bg-gray-900/50 px-3 py-2 text-xs text-gray-300 log-filter-input"
          placeholder="Filter logs by IP, path, message, type, or status..."
          aria-label="Filter logs"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        {visibleLogs.length === 0 ? (
          <div className="text-center text-gray-600 mt-10">No traffic detected</div>
        ) : (
          <table className="w-full text-left border-collapse log-table" style={{ minWidth: '860px' }}>
            <thead className="sticky top-0 bg-gray-900 z-10">
              <tr className="text-gray-500 text-xs border-b border-gray-800">
                <th className="pb-2 pl-2">Time</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">IP Address</th>
                <th className="pb-2">Path</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Message</th>
              </tr>
            </thead>
            <tbody className="text-sm font-mono">
              {visibleLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                  <td className="py-2 pl-2 text-gray-400">{formatTime(log.timestamp)}</td>
                  <td className="py-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        log.type === 'ATTACK'
                          ? 'border-red-500/30 bg-red-500/10 text-red-400'
                          : 'border-gray-700/50 bg-gray-800/50 text-gray-400'
                      }`}
                    >
                      {log.type}
                    </span>
                  </td>
                  <td className="py-2 text-secondary">{log.ip}</td>
                  <td className="py-2 text-gray-300 truncate-cell" title={log.path}>{log.path}</td>
                  <td className="py-2">
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${getStatusBadgeClasses(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2 text-gray-400 text-xs truncate-cell" title={log.message}>
                    {log.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
