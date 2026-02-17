import { Shield, Target, Zap } from 'lucide-react';
import { ATTACK_TYPES } from '../simulation/SimulationEngineV2';

/**
 * Enhanced Control Panel with attack type selector and defense configurator
 */
export const ControlPanelV2 = ({ 
  config, 
  defenses,
  onToggleAttack, 
  onSetIntensity, 
  onSetAttackType,
  onToggleDefense 
}) => {
  return (
    <div className="glass-panel p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
        <Zap className="text-warning-color" size={24} />
        Command Center
      </h2>
      
      <div className="space-y-6">
        {/* Attack Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className={config.isUnderAttack ? "text-danger" : "text-gray-500"} size={20} />
              <div>
                <span className="block text-gray-200 font-medium">Launch Attack</span>
                <span className="text-xs text-gray-500">Simulate brute-force attack</span>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={config.isUnderAttack} 
              onChange={(e) => onToggleAttack(e.target.checked)}
              className="toggle"
            />
          </div>
          
          <div className={`attack-config transition-all duration-300 ${config.isUnderAttack ? 'opacity-100 max-h-96' : 'opacity-50 max-h-0 overflow-hidden'}`}>
            <div className="pl-4 border-l-2 border-red-500/30 ml-2 space-y-4">
              {/* Attack Type Selector */}
              <div>
                <label className="text-xs text-gray-400 block mb-2">Attack Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(ATTACK_TYPES).slice(0, 4).map(type => (
                    <button
                      key={type.id}
                      onClick={() => onSetAttackType(type.id)}
                      className={`p-2 rounded-lg text-xs text-left transition-all ${
                        config.attackType === type.id 
                          ? 'bg-red-500/20 border border-red-500/50' 
                          : 'bg-gray-800/50 border border-gray-700/50 hover:border-gray-600'
                      }`}
                    >
                      <span className="text-lg">{type.icon}</span>
                      <span className="block text-gray-200 font-medium">{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Attack Intensity */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-gray-400">Intensity</label>
                  <span className="text-sm text-danger font-bold">{config.attackIntensity}x</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  value={config.attackIntensity} 
                  onChange={(e) => onSetIntensity(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-700/50" />

        {/* Defense Controls */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Shield size={16} /> Defense Mechanisms
          </h3>
          
          <div className="space-y-3">
            {Object.values(defenses).slice(0, 6).map(defense => (
              <div key={defense.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{defense.icon}</span>
                  <div>
                    <span className="block text-gray-200 text-sm">{defense.name}</span>
                    <span className="text-xs text-gray-500">{defense.description.substring(0, 30)}...</span>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={defense.enabled} 
                  onChange={(e) => onToggleDefense(defense.id, e.target.checked)}
                  className="toggle toggle-sm"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
