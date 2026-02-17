import { Activity, AlertTriangle, Lock, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { LogTable } from './components/LogTable';
import { StatCard } from './components/StatCard';
import { TrafficChart } from './components/TrafficChart';
import { SimulationEngine } from './simulation/SimulationEngine';

const engine = new SimulationEngine();

function App() {
  const [stats, setStats] = useState(engine.stats);
  const [logs, setLogs] = useState(engine.logs);
  const [config, setConfig] = useState(engine.config);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    engine.start();
    const unsubscribe = engine.subscribe((data) => {
      setStats({ ...data.stats });
      setLogs([...data.logs]);
      setConfig({ ...data.config });
      
      setChartData(prev => {
        const newData = [...prev, { time: new Date().toLocaleTimeString(), rps: data.stats.rps }];
        if (newData.length > 30) newData.shift(); // Keep last 30 points
        return newData;
      });
    });

    return () => {
      engine.stop();
      unsubscribe();
    };
  }, []);

  const handleToggleAttack = (val) => engine.toggleAttack(val);
  const handleSetIntensity = (val) => engine.setAttackIntensity(val);
  const handleToggleFirewall = (val) => engine.toggleFirewall(val);

  return (
    <div className="min-h-screen p-8 text-white font-sans">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-text">
            Security Operations Center
          </h1>
          <p className="text-gray-500">Brute-Force Attack Simulation & Defense System</p>
        </div>
        <div className="flex gap-4">
           {/* Status Indicators */}
           <div className={`px-4 py-2 rounded-full border flex items-center gap-2 ${config.isUnderAttack ? 'border-red-500/30 bg-red-500/10 text-danger' : 'border-green-500/30 bg-green-500/10 text-primary'}`}>
             <div className={`w-2 h-2 rounded-full ${config.isUnderAttack ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
             {config.isUnderAttack ? 'UNDER ATTACK' : 'SYSTEM SECURE'}
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard title="Total Requests" value={stats.totalRequests.toLocaleString()} icon={Activity} color="#00b8ff" />
        <StatCard title="Blocked Requests" value={stats.blockedRequests.toLocaleString()} icon={Shield} color="#ffca28" />
        <StatCard title="Failed Logins" value={stats.failedAuth.toLocaleString()} icon={AlertTriangle} color="#ff4d4d" />
        <StatCard title="Active Bans" value={config.blacklist.size} icon={Lock} color="#e0e0e0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <TrafficChart data={chartData} />
        </div>
        <div>
          <ControlPanel 
            config={config} 
            onToggleAttack={handleToggleAttack}
            onSetIntensity={handleSetIntensity}
            onToggleFirewall={handleToggleFirewall}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <LogTable logs={logs} />
      </div>
    </div>
  );
}

export default App;
