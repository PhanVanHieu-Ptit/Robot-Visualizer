import { Battery, Gauge, Hash, MapPin, Zap, RefreshCw } from 'lucide-react';
import { useRobotStore } from '../../store/robotStore';
import type { RobotStatus } from '../../types';

const STATUS_CONFIG: Record<RobotStatus, { label: string; bg: string; text: string }> = {
  idle: { label: 'Idle', bg: 'bg-blue-900/60', text: 'text-blue-300' },
  moving: { label: 'Moving', bg: 'bg-green-900/60', text: 'text-green-300' },
  charging: { label: 'Charging', bg: 'bg-yellow-900/60', text: 'text-yellow-300' },
  error: { label: 'Error', bg: 'bg-red-900/60', text: 'text-red-300' },
};

interface RobotDetailPanelProps {
  onForceCharge: (id: string) => void;
  onResetError: (id: string) => void;
}

export function RobotDetailPanel({ onForceCharge, onResetError }: RobotDetailPanelProps) {
  const robots = useRobotStore((s) => s.robots);
  const selectedRobotId = useRobotStore((s) => s.selectedRobotId);
  const robot = robots.find((r) => r.id === selectedRobotId) ?? null;

  const isVisible = robot !== null;

  const batteryBarColor =
    !robot ? 'bg-gray-600'
    : robot.batteryLevel > 50 ? 'bg-green-400'
    : robot.batteryLevel > 20 ? 'bg-yellow-400'
    : 'bg-red-400';

  const batteryTextColor =
    !robot ? 'text-gray-400'
    : robot.batteryLevel > 50 ? 'text-green-400'
    : robot.batteryLevel > 20 ? 'text-yellow-400'
    : 'text-red-400';

  const statusConfig = robot ? STATUS_CONFIG[robot.status] : STATUS_CONFIG.idle;

  return (
    <div
      className={`absolute top-0 right-0 bottom-20 w-72 pointer-events-auto transition-transform duration-300 ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ zIndex: 10 }}
    >
      <div className="h-full bg-gray-900/95 backdrop-blur-md border-l border-gray-800 flex flex-col p-4 gap-4">
        {robot && (
          <>
            <div className="flex items-center justify-between pt-2">
              <span className="text-lg font-mono font-bold text-white">{robot.id}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig.bg} ${statusConfig.text}`}
              >
                {statusConfig.label}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <div className="flex items-center gap-1.5">
                  <Battery size={11} className={batteryTextColor} />
                  <span>Battery</span>
                </div>
                <span className={`font-mono ${batteryTextColor}`}>
                  {robot.batteryLevel.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${batteryBarColor}`}
                  style={{ width: `${robot.batteryLevel}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin size={12} className="shrink-0" />
                <span className="font-mono text-xs">
                  ({robot.x.toFixed(2)}, {robot.y.toFixed(2)}, {robot.z.toFixed(2)})
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-400">
                <Gauge size={12} className="shrink-0" />
                <span className="text-xs">{robot.speed.toFixed(2)} m/s</span>
              </div>

              {robot.taskId && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Hash size={12} className="shrink-0" />
                  <span className="text-xs font-mono">{robot.taskId}</span>
                </div>
              )}
            </div>

            <div className="mt-auto space-y-2">
              <button
                onClick={() => onForceCharge(robot.id)}
                disabled={robot.status === 'charging'}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-yellow-600/50 text-yellow-400 hover:bg-yellow-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Zap size={12} />
                Force charge
              </button>
              <button
                onClick={() => onResetError(robot.id)}
                disabled={robot.status !== 'error'}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-red-600/50 text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw size={12} />
                Reset error
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
