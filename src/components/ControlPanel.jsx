import { Shield, ShieldAlert, Zap } from 'lucide-react';

export const ControlPanel = ({ config, onToggleAttack, onSetIntensity, onToggleFirewall }) => {
  return (
    <div className="glass-panel p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
        <Zap className="text-warning" size={24} />
        Control Center
      </h2>
      
      <div className="space-y-8">
        {/* Attack Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className={config.isUnderAttack ? "text-danger" : "text-gray-500"} size={20} />
              <div>
                <span className="block text-gray-200 font-medium">Simulate Attack</span>
                <span className="text-xs text-gray-500">Generate brute-force traffic</span>
              </div>
            </div>
            <input 
              id="legacy-attack-toggle"
              type="checkbox" 
              checked={config.isUnderAttack} 
              onChange={(e) => onToggleAttack(e.target.checked)}
              className="toggle"
              aria-label="Toggle attack simulation"
            />
          </div>
          
          <div className={`transition-all duration-300 ${config.isUnderAttack ? 'opacity-100 max-h-20' : 'opacity-50 max-h-0 overflow-hidden'}`}>
            <div className="pl-4 border-l-2 border-red-500/30 ml-2">
              <div className="flex justify-between mb-2">
                <label htmlFor="legacy-attack-intensity" className="text-sm text-gray-400">Attack Intensity</label>
                <span className="text-sm text-danger font-bold">{config.attackIntensity}x</span>
              </div>
              <input 
                id="legacy-attack-intensity"
                type="range" 
                min="1" 
                max="20" 
                value={config.attackIntensity} 
                onChange={(e) => onSetIntensity(parseInt(e.target.value))}
                className="w-full"
                aria-label="Attack intensity"
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-700/50" />

        {/* Defense Controls */}
        <div className="space-y-4">
           <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className={config.firewallEnabled ? "text-primary" : "text-gray-500"} size={20} />
              <div>
                <span className="block text-gray-200 font-medium">Active Defense (WAF)</span>
                <span className="text-xs text-gray-500">Rate limiting & IP blocking</span>
              </div>
            </div>
            <input 
              id="legacy-waf-toggle"
              type="checkbox" 
              checked={config.firewallEnabled} 
              onChange={(e) => onToggleFirewall(e.target.checked)}
              className="toggle"
              aria-label="Toggle active defense"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
