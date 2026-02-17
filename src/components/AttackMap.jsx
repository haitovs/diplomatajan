import { useMemo, useState } from 'react';

const VIEWBOX = { width: 960, height: 480 };

const COUNTRY_FALLBACKS = {
  RU: { name: 'Russia', lat: 55.75, lon: 37.62 },
  CN: { name: 'China', lat: 39.9, lon: 116.4 },
  BR: { name: 'Brazil', lat: -23.55, lon: -46.63 },
  IN: { name: 'India', lat: 28.61, lon: 77.23 },
  NG: { name: 'Nigeria', lat: 6.45, lon: 3.39 },
  US: { name: 'United States', lat: 40.71, lon: -74.01 },
  IR: { name: 'Iran', lat: 35.69, lon: 51.39 },
  PK: { name: 'Pakistan', lat: 24.86, lon: 67.01 },
};

const SERVER_LOCATIONS = {
  US_EAST: { name: 'US East Datacenter', lat: 39.1, lon: -77.3 },
  EU_CENTRAL: { name: 'EU Central Datacenter', lat: 50.11, lon: 8.68 },
};

const LANDMASSES = [
  [
    [-165, 12], [-150, 72], [-60, 72], [-50, 14], [-95, 8],
  ],
  [
    [-82, 12], [-36, 12], [-50, -56], [-72, -55],
  ],
  [
    [-11, 35], [20, 71], [178, 72], [170, 10], [110, 1], [60, 7], [35, 32], [-10, 30],
  ],
  [
    [-20, 35], [52, 35], [50, -35], [13, -37], [-17, -2],
  ],
  [
    [112, -10], [155, -10], [156, -44], [112, -43],
  ],
  [
    [-74, 58], [-20, 58], [-12, 83], [-60, 84],
  ],
];

const project = (lat, lon) => ({
  x: ((lon + 180) / 360) * VIEWBOX.width,
  y: ((90 - lat) / 180) * VIEWBOX.height,
});

const buildArcPath = (source, target) => {
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  const distance = Math.hypot(target.x - source.x, target.y - source.y);
  const curveHeight = Math.min(130, 30 + distance * 0.2);
  return `M ${source.x} ${source.y} Q ${midX} ${midY - curveHeight} ${target.x} ${target.y}`;
};

const getOriginColor = (ratio) => {
  if (ratio > 0.75) return '#fb7185';
  if (ratio > 0.5) return '#f97316';
  return '#fbbf24';
};

const formatAttackTypeLabel = (typeId = '') =>
  typeId
    .split('_')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');

const isBlockedStatus = (status) => [403, 423, 428, 429].includes(status);

const matchesResultFilter = (status, filter) => {
  if (filter === 'all') return true;
  if (filter === 'blocked') return isBlockedStatus(status);
  if (filter === 'failed') return status === 401;
  if (filter === 'success') return status === 200;
  return true;
};

const getResultCount = (bucket, filter) => {
  if (!bucket) return 0;
  if (filter === 'all') return bucket.total || 0;
  return bucket.outcomes?.[filter] || 0;
};

export const AttackMap = ({
  telemetry = null,
  attacks = [],
  serverLocation = 'US_EAST',
  isUnderAttack = false,
  windowMs = 90_000,
  activeAttackTypeId = null,
}) => {
  const [hoveredOrigin, setHoveredOrigin] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');

  const availableAttackTypes = useMemo(() => {
    if (telemetry?.availableAttackTypes?.length) {
      return telemetry.availableAttackTypes;
    }

    const uniqueTypes = new Set();
    attacks.forEach((attack) => {
      if (attack.attackType) uniqueTypes.add(attack.attackType);
    });
    return [...uniqueTypes];
  }, [telemetry, attacks]);
  const resolvedTypeFilter =
    typeFilter !== 'all' && !availableAttackTypes.includes(typeFilter)
      ? 'all'
      : typeFilter;

  const server = useMemo(() => {
    if (typeof serverLocation === 'object' && serverLocation?.lat != null && serverLocation?.lon != null) {
      return serverLocation;
    }
    return SERVER_LOCATIONS[serverLocation] || SERVER_LOCATIONS.US_EAST;
  }, [serverLocation]);

  const { origins, totalRequests, activeRequests, resolvedWindowMs } = useMemo(() => {
    if (telemetry?.origins) {
      const mappedOrigins = telemetry.origins
        .map((origin) => {
          const fallback = COUNTRY_FALLBACKS[origin.country] || COUNTRY_FALLBACKS.US;
          const selectedBucket =
            resolvedTypeFilter === 'all'
              ? {
                total: origin.total || 0,
                outcomes: origin.outcomes || {},
              }
              : origin.byType?.[resolvedTypeFilter];
          const count = getResultCount(selectedBucket, resultFilter);

          if (count <= 0) return null;

          return {
            country: origin.country || fallback.country || 'US',
            name: origin.name || fallback.name,
            lat: Number.isFinite(origin.lat) ? origin.lat : fallback.lat,
            lon: Number.isFinite(origin.lon) ? origin.lon : fallback.lon,
            count,
          };
        })
        .filter(Boolean);

      const sorted = mappedOrigins.sort((a, b) => b.count - a.count);
      return {
        origins: sorted.slice(0, 8),
        totalRequests: telemetry.totalRequests || 0,
        activeRequests: sorted.reduce((sum, origin) => sum + origin.count, 0),
        resolvedWindowMs: telemetry.windowMs || windowMs,
      };
    }

    const latestTimestamp = attacks.reduce((max, attack) => {
      if (!Number.isFinite(attack.timestamp)) return max;
      return Math.max(max, attack.timestamp);
    }, 0);
    const cutoff = windowMs > 0 && latestTimestamp > 0 ? latestTimestamp - windowMs : 0;
    const inWindow = attacks.filter((attack) => {
      if (!attack.timestamp) return true;
      return attack.timestamp >= cutoff;
    }).filter((attack) => {
      const matchesType = resolvedTypeFilter === 'all' || attack.attackType === resolvedTypeFilter;
      const matchesResult = matchesResultFilter(attack.status, resultFilter);
      return matchesType && matchesResult;
    });

    const grouped = new Map();
    inWindow.forEach((attack) => {
      const country = attack.origin?.country || 'US';
      const fallback = COUNTRY_FALLBACKS[country] || COUNTRY_FALLBACKS.US;
      const lat = Number.isFinite(attack.origin?.lat) ? attack.origin.lat : fallback.lat;
      const lon = Number.isFinite(attack.origin?.lon) ? attack.origin.lon : fallback.lon;
      const name = attack.origin?.name || fallback.name;

      const current = grouped.get(country) || {
        country,
        name,
        lat,
        lon,
        count: 0,
      };

      current.count += 1;
      current.lat = lat;
      current.lon = lon;
      current.name = name;
      grouped.set(country, current);
    });

    return {
      origins: [...grouped.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      totalRequests: attacks.length,
      activeRequests: inWindow.length,
      resolvedWindowMs: windowMs,
    };
  }, [telemetry, attacks, windowMs, resolvedTypeFilter, resultFilter]);

  const projectedServer = project(server.lat, server.lon);
  const peak = origins[0]?.count || 1;
  const canShowHoveredOrigin =
    hoveredOrigin && origins.some((origin) => origin.country === hoveredOrigin.country);

  return (
    <div className="glass-panel p-4">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-medium text-gray-400">Attack Origin Map</h3>
        {isUnderAttack && (
          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400 animate-pulse">
            ACTIVE
          </span>
        )}
        <span className="ml-auto text-xs text-gray-500">Window {Math.round(resolvedWindowMs / 1000)}s</span>
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={resolvedTypeFilter === 'all'}
          className={`rounded-full border px-2 py-1 text-xs transition-colors ${
            resolvedTypeFilter === 'all'
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : 'border-gray-700/50 bg-gray-800/50 text-gray-400 hover:border-gray-500'
          }`}
          onClick={() => setTypeFilter('all')}
        >
          All Types
        </button>
        {availableAttackTypes.map((type) => (
          <button
            key={type}
            type="button"
            aria-pressed={resolvedTypeFilter === type}
            className={`rounded-full border px-2 py-1 text-xs transition-colors ${
              resolvedTypeFilter === type
                ? 'border-green-500/30 bg-green-500/10 text-green-400'
                : 'border-gray-700/50 bg-gray-800/50 text-gray-400 hover:border-gray-500'
            }`}
            onClick={() => setTypeFilter(type)}
          >
            {formatAttackTypeLabel(type)}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {['all', 'blocked', 'failed', 'success'].map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={resultFilter === option}
            className={`rounded-full border px-2 py-1 text-xs transition-colors ${
              resultFilter === option
                ? 'border-red-500/30 bg-red-500/10 text-red-400'
                : 'border-gray-700/50 bg-gray-800/50 text-gray-400 hover:border-gray-500'
            }`}
            onClick={() => setResultFilter(option)}
          >
            {option === 'all' ? 'All Outcomes' : option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
        {activeAttackTypeId && (
          <button
            type="button"
            className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs text-blue-500 transition-colors hover:border-gray-500"
            onClick={() => setTypeFilter(activeAttackTypeId)}
          >
            Focus Live Type
          </button>
        )}
      </div>

      <div className="attack-map-canvas relative h-64 w-full overflow-hidden rounded-lg border border-gray-700/50 bg-gray-900/50">
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} role="img" aria-label="World attack origin projection map">
          <defs>
            <linearGradient id="mapBackground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0b1324" />
              <stop offset="100%" stopColor="#05080f" />
            </linearGradient>
            <linearGradient id="landGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1f2937" />
              <stop offset="100%" stopColor="#111827" />
            </linearGradient>
          </defs>

          <rect width={VIEWBOX.width} height={VIEWBOX.height} fill="url(#mapBackground)" />

          {Array.from({ length: 11 }).map((_, index) => {
            const y = (index / 10) * VIEWBOX.height;
            return <line key={`lat-${y}`} x1="0" y1={y} x2={VIEWBOX.width} y2={y} stroke="#334155" strokeWidth="1" opacity="0.3" />;
          })}
          {Array.from({ length: 13 }).map((_, index) => {
            const x = (index / 12) * VIEWBOX.width;
            return <line key={`lon-${x}`} x1={x} y1="0" x2={x} y2={VIEWBOX.height} stroke="#334155" strokeWidth="1" opacity="0.3" />;
          })}

          {LANDMASSES.map((polygon, index) => {
            const points = polygon
              .map(([lon, lat]) => {
                const projected = project(lat, lon);
                return `${projected.x},${projected.y}`;
              })
              .join(' ');
            return <polygon key={`land-${index}`} points={points} className="attack-map-land" fill="url(#landGradient)" />;
          })}

          {origins.map((origin) => {
            const ratio = origin.count / peak;
            const color = getOriginColor(ratio);
            const projectedOrigin = project(origin.lat, origin.lon);

            return (
              <g
                key={origin.country}
                onMouseEnter={() => setHoveredOrigin(origin)}
                onMouseLeave={() => setHoveredOrigin(null)}
              >
                <path
                  d={buildArcPath(projectedOrigin, projectedServer)}
                  className={isUnderAttack ? 'attack-map-arc attack-map-arc-active' : 'attack-map-arc'}
                  stroke={color}
                  strokeWidth={1 + ratio * 3}
                  style={{ opacity: 0.45 + ratio * 0.4 }}
                >
                  <title>{`${origin.name} (${origin.country}) - ${origin.count} requests`}</title>
                </path>
                <circle
                  cx={projectedOrigin.x}
                  cy={projectedOrigin.y}
                  r={3 + ratio * 5}
                  className={isUnderAttack ? 'attack-map-origin attack-map-origin-active' : 'attack-map-origin'}
                  fill={color}
                >
                  <title>{`${origin.name} (${origin.country}) - ${origin.count} requests`}</title>
                </circle>
                <text x={projectedOrigin.x} y={projectedOrigin.y - 12} textAnchor="middle" className="attack-map-count">
                  {origin.count}
                </text>
              </g>
            );
          })}

          <circle cx={projectedServer.x} cy={projectedServer.y} r="11" className="attack-map-server-halo" />
          <circle cx={projectedServer.x} cy={projectedServer.y} r="5" className={isUnderAttack ? 'attack-map-server attack-map-server-danger' : 'attack-map-server'} />
          <text x={projectedServer.x} y={projectedServer.y + 18} textAnchor="middle" className="attack-map-target-label">
            {server.name}
          </text>
        </svg>

        {origins.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
            No recent attack origins in selected time window
          </div>
        )}

        {canShowHoveredOrigin && (
          <div className="absolute top-2 right-2 rounded-lg border border-gray-700/50 bg-gray-900/95 p-2 text-xs">
            <div className="font-bold text-white">{hoveredOrigin.name}</div>
            <div className="text-gray-400">Code: {hoveredOrigin.country}</div>
            <div className="text-gray-400">Requests: {hoveredOrigin.count}</div>
            <div className="text-gray-500">{`${hoveredOrigin.lat.toFixed(2)}, ${hoveredOrigin.lon.toFixed(2)}`}</div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
        <span>{origins.length} origin zones</span>
        <span>{activeRequests} matching requests</span>
        <span>{totalRequests} attacks in window</span>
      </div>

      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Target server</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Medium source volume</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>High source volume</span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {origins.slice(0, 4).map((origin) => {
          const ratio = origin.count / peak;
          const color = getOriginColor(ratio);
          return (
            <div key={`rank-${origin.country}`} className="flex items-center gap-2 text-xs">
              <span className="w-16 truncate text-gray-400" title={origin.name}>
                {origin.country}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
                <div className="h-full rounded-full" style={{ width: `${Math.max(8, ratio * 100)}%`, backgroundColor: color }} />
              </div>
              <span className="w-10 text-right font-mono text-gray-300">{origin.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
