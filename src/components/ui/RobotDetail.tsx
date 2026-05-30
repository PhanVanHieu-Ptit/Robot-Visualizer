import { Battery, Gauge, Hash, MapPin } from 'lucide-react';
import { useRobotStore } from '../../store/robotStore';

export function RobotDetail() {
  const robots = useRobotStore((s) => s.robots);
  const selectedRobotId = useRobotStore((s) => s.selectedRobotId);
  const robot = robots.find((r) => r.id === selectedRobotId);

  if (!robot) return null;

  const batteryColor =
    robot.batteryLevel > 50
      ? 'text-green-400'
      : robot.batteryLevel > 20
        ? 'text-yellow-400'
        : 'text-red-400';

  const batteryBarColor =
    robot.batteryLevel > 50 ? 'bg-green-400' : robot.batteryLevel > 20 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <div className="p-3 border-t border-gray-800 space-y-2.5 text-sm shrink-0">
      <div className="font-semibold text-white">{robot.id}</div>

      <div className="flex items-center gap-2 text-gray-400">
        <MapPin size={12} />
        <span>
          ({robot.x.toFixed(1)}, {robot.y.toFixed(1)}, {robot.z.toFixed(1)})
        </span>
      </div>

      <div className="flex items-center gap-2 text-gray-400">
        <Gauge size={12} />
        <span>{robot.speed.toFixed(2)} m/s</span>
      </div>

      <div className="flex items-center gap-2">
        <Battery size={12} className={batteryColor} />
        <div className="flex-1 bg-gray-800 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${batteryBarColor}`}
            style={{ width: `${robot.batteryLevel}%` }}
          />
        </div>
        <span className={`${batteryColor} text-xs w-8 text-right`}>
          {robot.batteryLevel.toFixed(0)}%
        </span>
      </div>

      {robot.taskId && (
        <div className="flex items-center gap-2 text-gray-400">
          <Hash size={12} />
          <span>{robot.taskId}</span>
        </div>
      )}
    </div>
  );
}
