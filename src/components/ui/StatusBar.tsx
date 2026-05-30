import { Bot, Wifi, WifiOff, Activity } from 'lucide-react';
import { useRobotStore } from '../../store/robotStore';

interface StatusBarProps {
  connected: boolean;
}

export function StatusBar({ connected }: StatusBarProps) {
  const robots = useRobotStore((s) => s.robots);
  const idle = robots.filter((r) => r.status === 'idle').length;
  const moving = robots.filter((r) => r.status === 'moving').length;
  const charging = robots.filter((r) => r.status === 'charging').length;
  const error = robots.filter((r) => r.status === 'error').length;

  return (
    <header className="h-12 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-6 shrink-0">
      <div className="flex items-center gap-2 font-semibold text-white">
        <Bot size={18} />
        <span>Robot Fleet Visualizer</span>
      </div>

      <div className="flex items-center gap-1.5 ml-auto text-sm">
        {connected ? (
          <>
            <Wifi size={14} className="text-green-400" />
            <span className="text-green-400">Live</span>
          </>
        ) : (
          <>
            <WifiOff size={14} className="text-yellow-400" />
            <span className="text-yellow-400">Simulation</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Activity size={12} />
          {robots.length} robots
        </span>
        <span className="text-blue-400">{idle} idle</span>
        <span className="text-green-400">{moving} moving</span>
        <span className="text-yellow-400">{charging} charging</span>
        <span className="text-red-400">{error} error</span>
      </div>
    </header>
  );
}
