import { Shield, Target, Zap } from 'lucide-react';
import { ATTACK_TYPES } from '../simulation/SimulationEngineV2';

const ATTACK_TYPE_LIST = Object.values(ATTACK_TYPES);

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
  const defenseList = Object.values(defenses);
  const enabledDefenses = defenseList.filter((defense) => defense.enabled).length;
  const disabledDefenses = defenseList.length - enabledDefenses;
  const orderedDefenses = defenseList.slice().sort((a, b) => Number(b.enabled) - Number(a.enabled));
  const selectedAttackType =
    ATTACK_TYPE_LIST.find((attackType) => attackType.id === config.attackType) || ATTACK_TYPE_LIST[0];
  const estimatedAttackRps = Math.round((1 + (config.attackIntensity * selectedAttackType.avgRps) / 20) * 10);

  const trimmedDescription = (description) => {
    if (!description) return 'No description';
    return description.length > 38 ? `${description.slice(0, 38)}...` : description;
  };

  return (
    <div className="glass-panel p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
        <Zap className="text-warning" size={24} />
        Command Center
      </h2>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-gray-700/50 bg-gray-800/50 px-2 py-0.5 text-gray-400">
          Attack Intensity {config.attackIntensity}x
        </span>
        <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-red-400">
          Nominal RPS ~{estimatedAttackRps}
        </span>
        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-blue-500">
          Defenses {enabledDefenses}/{defenseList.length} Active
        </span>
        <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-yellow-500">
          Gaps {disabledDefenses}
        </span>
      </div>
      
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
              id="toggle-attack"
              type="checkbox" 
              checked={config.isUnderAttack} 
              onChange={(e) => onToggleAttack(e.target.checked)}
              className="toggle"
              aria-label="Toggle attack simulation"
            />
          </div>
          
          <div className={`attack-config transition-all duration-300 ${config.isUnderAttack ? 'opacity-100 max-h-96' : 'opacity-50 max-h-0 overflow-hidden'}`}>
            <div className="pl-4 border-l-2 border-red-500/30 ml-2 space-y-4">
              {/* Attack Type Selector */}
              <div>
                <label className="text-xs text-gray-400 block mb-2">Attack Type</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ATTACK_TYPE_LIST.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => onSetAttackType(type.id)}
                      aria-pressed={config.attackType === type.id}
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

                <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden="true">{selectedAttackType.icon}</span>
                    <span className="text-sm font-medium text-red-400">{selectedAttackType.name}</span>
                  </div>
                  <p id="attack-type-description" className="mt-1 text-xs text-gray-300">
                    {selectedAttackType.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-400">
                    <span className="rounded-full border border-gray-700/50 bg-gray-900/50 px-2 py-0.5">
                      Avg RPS Profile {selectedAttackType.avgRps}
                    </span>
                    <span className="rounded-full border border-gray-700/50 bg-gray-900/50 px-2 py-0.5">
                      Success Chance {(selectedAttackType.successRate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Attack Intensity */}
              <div>
                <div className="flex justify-between mb-2">
                  <label htmlFor="attack-intensity" className="text-sm text-gray-400">Intensity</label>
                  <span id="attack-intensity-value" className="text-sm text-danger font-bold">
                    {config.attackIntensity}x
                  </span>
                </div>
                <input 
                  id="attack-intensity"
                  type="range" 
                  min="1" 
                  max="20" 
                  value={config.attackIntensity} 
                  onChange={(e) => onSetIntensity(parseInt(e.target.value, 10))}
                  className="w-full"
                  aria-label="Attack intensity"
                  aria-describedby="attack-intensity-value attack-type-description"
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
          
          <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
            {orderedDefenses.map(defense => (
              <div key={defense.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{defense.icon}</span>
                  <div>
                    <span className="block text-gray-200 text-sm">{defense.name}</span>
                    <span className="text-xs text-gray-500">{trimmedDescription(defense.description)}</span>
                  </div>
                </div>
                <input 
                  id={`defense-${defense.id}`}
                  type="checkbox" 
                  checked={defense.enabled} 
                  onChange={(e) => onToggleDefense(defense.id, e.target.checked)}
                  className="toggle toggle-sm"
                  aria-label={`Toggle ${defense.name}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
