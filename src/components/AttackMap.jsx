import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * Attack Map Visualization
 * Shows attack origins on a simplified world map with animated attack vectors
 */

// Simplified world map SVG path
const WORLD_MAP_PATH = "M 10,50 Q 25,10 50,30 T 90,45 Q 85,60 95,75 Q 75,85 60,70 Q 40,85 30,70 Q 15,80 10,50 Z M 5,30 Q 15,20 25,35 T 8,40 Q 5,35 5,30 Z";

// City coordinates on the map (x, y as percentages)
const LOCATIONS = {
  'RU': { x: 70, y: 25, name: 'Russia' },
  'CN': { x: 82, y: 38, name: 'China' },
  'BR': { x: 30, y: 65, name: 'Brazil' },
  'IN': { x: 72, y: 45, name: 'India' },
  'NG': { x: 48, y: 52, name: 'Nigeria' },
  'US': { x: 22, y: 35, name: 'USA' },
  'IR': { x: 62, y: 40, name: 'Iran' },
  'PK': { x: 68, y: 42, name: 'Pakistan' },
  'EU': { x: 50, y: 28, name: 'Europe' },
  'SERVER': { x: 50, y: 50, name: 'Target Server' },
};

export const AttackMap = ({ attacks = [], serverLocation = 'SERVER', isUnderAttack = false }) => {
  const [activeAttacks, setActiveAttacks] = useState([]);
  
  useEffect(() => {
    // Aggregate attacks by origin
    const originCounts = {};
    attacks.forEach(attack => {
      const country = attack.origin?.country || 'US';
      originCounts[country] = (originCounts[country] || 0) + 1;
    });
    
    // Convert to array
    const attackList = Object.entries(originCounts).map(([country, count]) => ({
      country,
      count,
      ...LOCATIONS[country] || LOCATIONS.US,
    }));
    
    setActiveAttacks(attackList);
  }, [attacks]);
  
  const server = LOCATIONS[serverLocation];
  
  return (
    <div className="glass-panel p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
        🌍 Attack Origin Map
        {isUnderAttack && (
          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full animate-pulse">
            ACTIVE
          </span>
        )}
      </h3>
      
      <div className="relative w-full h-64 bg-gray-900/50 rounded-lg overflow-hidden">
        {/* Grid background */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#4a5568" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        
        {/* Simplified continent shapes */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          {/* North America */}
          <path d="M 10,20 Q 20,15 30,20 L 35,35 Q 25,45 15,40 Q 8,35 10,20" fill="#1e3a2f" stroke="#22c55e" strokeWidth="0.3" opacity="0.6"/>
          {/* South America */}
          <path d="M 25,50 Q 35,48 32,60 L 28,75 Q 22,72 20,60 Q 20,52 25,50" fill="#1e3a2f" stroke="#22c55e" strokeWidth="0.3" opacity="0.6"/>
          {/* Europe */}
          <path d="M 45,18 Q 55,15 58,22 L 56,32 Q 48,35 45,28 Q 43,22 45,18" fill="#1e3a2f" stroke="#22c55e" strokeWidth="0.3" opacity="0.6"/>
          {/* Africa */}
          <path d="M 45,38 Q 55,35 58,45 L 55,65 Q 48,68 45,58 Q 42,48 45,38" fill="#1e3a2f" stroke="#22c55e" strokeWidth="0.3" opacity="0.6"/>
          {/* Asia */}
          <path d="M 60,15 Q 85,12 90,30 L 88,48 Q 75,55 65,45 Q 58,35 60,15" fill="#1e3a2f" stroke="#22c55e" strokeWidth="0.3" opacity="0.6"/>
          {/* Australia */}
          <path d="M 80,60 Q 90,58 92,68 L 88,75 Q 78,76 78,68 Q 78,62 80,60" fill="#1e3a2f" stroke="#22c55e" strokeWidth="0.3" opacity="0.6"/>
          
          {/* Attack Lines */}
          <AnimatePresence>
            {activeAttacks.map((attack, idx) => (
              <motion.g key={attack.country}>
                {/* Attack line */}
                <motion.line
                  x1={attack.x}
                  y1={attack.y}
                  x2={server.x}
                  y2={server.y}
                  stroke="#ef4444"
                  strokeWidth="0.5"
                  strokeDasharray="2 2"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.6 }}
                  transition={{ duration: 1, delay: idx * 0.1 }}
                />
                
                {/* Animated attack particle */}
                {isUnderAttack && (
                  <motion.circle
                    r="1"
                    fill="#ef4444"
                    initial={{ cx: attack.x, cy: attack.y }}
                    animate={{
                      cx: [attack.x, server.x],
                      cy: [attack.y, server.y],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: idx * 0.3,
                      ease: "linear"
                    }}
                  />
                )}
                
                {/* Origin point */}
                <motion.circle
                  cx={attack.x}
                  cy={attack.y}
                  r="2"
                  fill="#ef4444"
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                
                {/* Attack count label */}
                <motion.text
                  x={attack.x}
                  y={attack.y - 4}
                  fontSize="3"
                  fill="#fff"
                  textAnchor="middle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {attack.count}
                </motion.text>
              </motion.g>
            ))}
          </AnimatePresence>
          
          {/* Target server */}
          <motion.circle
            cx={server.x}
            cy={server.y}
            r="3"
            fill={isUnderAttack ? "#ef4444" : "#22c55e"}
            stroke="#fff"
            strokeWidth="0.5"
            animate={isUnderAttack ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          <text x={server.x} y={server.y + 6} fontSize="2.5" fill="#fff" textAnchor="middle">
            TARGET
          </text>
        </svg>
        
        {/* Legend */}
        <div className="absolute bottom-2 left-2 flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-400">Attack Origin</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-400">Server</span>
          </div>
        </div>
        
        {/* Stats overlay */}
        <div className="absolute top-2 right-2 text-xs text-gray-400">
          <div>{activeAttacks.length} origins</div>
          <div>{attacks.length} requests</div>
        </div>
      </div>
    </div>
  );
};
