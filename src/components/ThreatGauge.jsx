import { motion } from 'framer-motion';

/**
 * Threat Level Gauge - Visual indicator of current threat level
 */
export const ThreatGauge = ({ level = 0, label = 'MINIMAL', color = '#6366f1' }) => {
  // Calculate rotation based on level (0-100 maps to -90 to 90 degrees)
  const rotation = (level / 100) * 180 - 90;
  
  return (
    <div className="glass-panel p-6 text-center">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Threat Level</h3>
      
      <div className="relative w-48 h-24 mx-auto overflow-hidden">
        {/* Background arc */}
        <div className="absolute inset-0">
          <svg viewBox="0 0 200 100" className="w-full h-full">
            {/* Background track */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#333"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Colored segment based on level */}
            <motion.path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={color}
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray="251.2"
              initial={{ strokeDashoffset: 251.2 }}
              animate={{ strokeDashoffset: 251.2 - (level / 100) * 251.2 }}
              transition={{ duration: 0.5 }}
            />
          </svg>
        </div>
        
        {/* Needle */}
        <motion.div 
          className="absolute bottom-0 left-1/2 w-1 h-16 origin-bottom"
          style={{ marginLeft: '-2px' }}
          initial={{ rotate: -90 }}
          animate={{ rotate: rotation }}
          transition={{ type: 'spring', stiffness: 50 }}
        >
          <div 
            className="w-1 h-full rounded-full"
            style={{ background: `linear-gradient(to top, ${color}, transparent)` }}
          />
          <div 
            className="absolute bottom-0 left-1/2 w-3 h-3 rounded-full -translate-x-1/2 translate-y-1/2"
            style={{ backgroundColor: color }}
          />
        </motion.div>
      </div>
      
      {/* Level display */}
      <div className="mt-4">
        <motion.div 
          className="text-4xl font-bold"
          style={{ color }}
          key={level}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
        >
          {level}%
        </motion.div>
        <div 
          className="text-sm font-medium mt-1 px-3 py-1 rounded-full inline-block"
          style={{ 
            backgroundColor: `${color}20`, 
            color 
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
};
