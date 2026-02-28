import { Activity, FileText, FlaskConical, Shield, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '../i18n/I18nProvider';

const NAV_ITEMS = [
  { id: 'workspace', icon: Activity, key: 'common.navigation.workspace' },
  { id: 'scenario', icon: Sparkles, key: 'common.navigation.scenario' },
  { id: 'defense', icon: Shield, key: 'common.navigation.defense' },
  { id: 'comparison', icon: FlaskConical, key: 'common.navigation.comparison' },
  { id: 'reports', icon: FileText, key: 'common.navigation.reports' },
];

const MotionButton = motion.button;

export const BastionNav = ({ activeView, onChange }) => {
  const { t } = useI18n();

  return (
    <nav className="bastion-nav mb-6">
      {NAV_ITEMS.map((item, index) => {
        const Icon = item.icon;
        const active = activeView === item.id;

        return (
          <MotionButton
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`bastion-nav-btn ${active ? 'is-active' : ''}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            aria-pressed={active}
          >
            <Icon size={16} />
            <span>{t(item.key)}</span>
          </MotionButton>
        );
      })}
    </nav>
  );
};
