import { memo, useMemo } from 'react';
import { Shield, Square, Target, Zap } from 'lucide-react';
import { ATTACK_TYPES } from '../simulation/SimulationEngineV2';
import { useI18n } from '../i18n/I18nProvider';

const ATTACK_TYPE_LIST = Object.values(ATTACK_TYPES);

const ControlPanelV2Base = ({
  config,
  defenses,
  onToggleAttack,
  onSetIntensity,
  onSetAttackType,
  onToggleDefense,
}) => {
  const { t } = useI18n();

  const defenseList = useMemo(() => Object.values(defenses), [defenses]);
  const enabledDefenses = useMemo(
    () => defenseList.filter((defense) => defense.enabled).length,
    [defenseList],
  );
  const disabledDefenses = defenseList.length - enabledDefenses;
  const orderedDefenses = useMemo(
    () => defenseList.slice().sort((a, b) => Number(b.enabled) - Number(a.enabled)),
    [defenseList],
  );
  const selectedAttackType =
    ATTACK_TYPE_LIST.find((attackType) => attackType.id === config.attackType) || ATTACK_TYPE_LIST[0];
  const estimatedAttackRps = Math.round((1 + (config.attackIntensity * selectedAttackType.avgRps) / 20) * 10);

  const trimmedDescription = (description) => {
    if (!description) return 'No description';
    return description.length > 52 ? `${description.slice(0, 52)}...` : description;
  };

  return (
    <div className="glass-panel p-6">
      <h2 className="text-xl font-bold mb-1 flex items-center gap-2 text-white">
        <Zap className="text-warning" size={24} />
        {t('defense.command.title')}
      </h2>
      <p className="text-xs text-bastion-text-mid mb-5">{t('defense.command.subtitle')}</p>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-gray-700/50 bg-gray-800/50 px-2 py-0.5 text-gray-400">
          {t('defense.command.intensity')} {config.attackIntensity}x
        </span>
        <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-red-400">
          {t('defense.command.nominalRps')} ~{estimatedAttackRps}
        </span>
        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-blue-500">
          {t('defense.command.activeDefenses')} {enabledDefenses}/{defenseList.length}
        </span>
        <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-yellow-500">
          {t('defense.command.gaps')} {disabledDefenses}
        </span>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-400">{t('defense.command.attackSection')}</h3>

          <div className="flex flex-wrap items-center gap-2 mb-1">
            <button type="button" className="bastion-primary-btn" onClick={() => onToggleAttack(true)}>
              <Target size={15} />
              {t('defense.command.start')}
            </button>
            <button type="button" className="bastion-outline-btn" onClick={() => onToggleAttack(false)}>
              <Square size={15} />
              {t('defense.command.stop')}
            </button>
          </div>

          <p className="text-xs text-bastion-text-mid">{t('defense.command.attackHelp')}</p>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <Target className={config.isUnderAttack ? 'text-danger' : 'text-gray-500'} size={20} />
              <div>
                <span className="block text-gray-200 font-medium">{t('defense.command.launchAttack')}</span>
                <span className="text-xs text-gray-500">{t('defense.command.simulateBruteforce')}</span>
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
              <div>
                <label className="text-xs text-gray-400 block mb-2">{t('defense.command.attackType')}</label>
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
                      {t('defense.command.successChance')} {(selectedAttackType.successRate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label htmlFor="attack-intensity" className="text-sm text-gray-400">{t('defense.command.intensity')}</label>
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

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Shield size={16} /> {t('defense.command.defenseSection')}
          </h3>
          <p className="text-xs text-bastion-text-mid">{t('defense.command.defenseHelp')}</p>

          <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
            {orderedDefenses.map((defense) => (
              <div key={defense.id} className="flex items-center justify-between gap-2">
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

export const ControlPanelV2 = memo(ControlPanelV2Base);
ControlPanelV2.displayName = 'ControlPanelV2';
