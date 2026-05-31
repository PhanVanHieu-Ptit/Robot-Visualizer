import { AreaChart, Area, Tooltip, ResponsiveContainer, YAxis } from 'recharts';
import { useRobotStore } from '../../store/robotStore';

export function TimelineBar() {
  const timelineHistory = useRobotStore((s) => s.timelineHistory);

  const data = timelineHistory.length === 0
    ? Array.from({ length: 60 }, (_, i) => ({ time: i, tasksPerSecond: 0 }))
    : timelineHistory;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      <div className="h-full bg-gray-900/60 backdrop-blur-sm border-t border-gray-700/30 relative">
        <div className="absolute top-1.5 left-3 flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Tasks / sec</span>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 16, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="taskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={[0, 'auto']} hide />
            <Tooltip
              contentStyle={{
                background: '#111827',
                border: '1px solid #374151',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#d1d5db',
              }}
              formatter={(value) => `${value} tasks`}
              labelFormatter={() => ''}
            />
            <Area
              type="monotone"
              dataKey="tasksPerSecond"
              stroke="#22c55e"
              strokeWidth={1.5}
              fill="url(#taskGradient)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
