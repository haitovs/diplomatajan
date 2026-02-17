import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export const TrafficChart = ({ data }) => {
  return (
    <div className="glass-panel p-6 h-300 flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-white">Traffic Volume (RPS)</h2>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00ff9d" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#666" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(str) => str.split(':').slice(1,3).join(':')} // Show MM:SS
            />
            <YAxis 
              stroke="#666" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#00ff9d' }}
              labelStyle={{ color: '#888' }}
            />
            <Area 
              type="monotone" 
              dataKey="rps" 
              stroke="#00ff9d" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorRps)" 
              isAnimationActive={false} // Disable animation for smoother real-time updates
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
