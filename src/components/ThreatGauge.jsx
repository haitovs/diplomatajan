/**
 * Threat Level Gauge - Visual indicator of current threat level.
 */
export const ThreatGauge = ({ level = 0, label = 'MINIMAL', color = '#6366f1' }) => {
  const safeLevel = Math.max(0, Math.min(100, level));
  const rotation = (safeLevel / 100) * 180 - 90;
  const strokeOffset = 251.2 - (safeLevel / 100) * 251.2;

  return (
    <div className="glass-panel p-6 text-center">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Threat Level</h3>

      <div className="relative w-48 h-24 mx-auto overflow-hidden">
        <div className="absolute inset-0">
          <svg viewBox="0 0 200 100" className="w-full h-full">
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#333"
              strokeWidth="16"
              strokeLinecap="round"
            />
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={color}
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray="251.2"
              strokeDashoffset={strokeOffset}
              className="gauge-path"
            />
          </svg>
        </div>

        <div
          className="absolute bottom-0 left-1/2 w-1 h-16 origin-bottom gauge-needle"
          style={{ marginLeft: '-2px', transform: `rotate(${rotation}deg)` }}
        >
          <div
            className="w-1 h-full rounded-full"
            style={{ background: `linear-gradient(to top, ${color}, transparent)` }}
          />
          <div
            className="absolute bottom-0 left-1/2 w-3 h-3 rounded-full -translate-x-1/2 translate-y-1/2"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="text-4xl font-bold gauge-value" style={{ color }}>
          {safeLevel}%
        </div>
        <div
          className="text-sm font-medium mt-1 px-3 py-1 rounded-full inline-block"
          style={{
            backgroundColor: `${color}20`,
            color,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
};
