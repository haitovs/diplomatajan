export const StatCard = ({ title, value, icon: Icon, color }) => {
  return (
    <div className="glass-panel stat-card p-4 min-w-0">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-gray-400 text-sm font-medium truncate">{title}</h3>
        <div
          className="p-2 rounded-lg flex items-center justify-center stat-card-icon"
          style={{ backgroundColor: `${color}20` }}
          aria-hidden="true"
        >
          {Icon && <Icon size={20} color={color} />}
        </div>
      </div>
      <div className="min-w-0 mt-2">
        <p className="text-2xl font-bold text-white truncate" title={String(value)}>
          {value}
        </p>
      </div>
      <div className="stat-card-accent mt-3 rounded-full" style={{ backgroundColor: color }} />
    </div>
  );
};
