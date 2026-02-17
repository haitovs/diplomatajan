import { AnimatePresence, motion } from 'framer-motion';

export const LogTable = ({ logs }) => {
  return (
    <div className="glass-panel p-6 h-400 flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-white">Traffic Logs</h2>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[#1a1a1a] z-10">
            <tr className="text-gray-500 text-xs border-b border-gray-800">
              <th className="pb-2 pl-2">Time</th>
              <th className="pb-2">IP Address</th>
              <th className="pb-2">Path</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Message</th>
            </tr>
          </thead>
          <tbody className="text-sm font-mono">
            <AnimatePresence initial={false}>
              {logs.slice().reverse().map((log) => (
                <motion.tr 
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border-b border-gray-800/50 hover:bg-white/5 transition-colors"
                >
                  <td className="py-2 pl-2 text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="py-2 text-secondary">{log.ip}</td>
                  <td className="py-2 text-gray-300">{log.path}</td>
                  <td className={`py-2 font-bold ${
                    log.status === 200 ? 'text-primary' : 
                    log.status === 429 ? 'text-warning' : 
                    log.status === 401 ? 'text-danger' : 'text-gray-400'
                  }`}>
                    {log.status}
                  </td>
                  <td className="py-2 text-gray-400 text-xs">{log.message}</td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="text-center text-gray-600 mt-10">No traffic detected</div>
        )}
      </div>
    </div>
  );
};
