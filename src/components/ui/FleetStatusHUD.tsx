import { useRobotStore } from '../../store/robotStore';

interface MetricTileProps {
  value: number;
  label: string;
  dotColor: string;
}

function MetricTile({ value, label, dotColor }: MetricTileProps) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-2">
      <span className="text-2xl font-mono font-bold text-white">{value}</span>
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
    </div>
  );
}

export function FleetStatusHUD() {
  const robots = useRobotStore((s) => s.robots);

  const total = robots.length;
  const active = robots.filter((r) => r.status === 'moving').length;
  const charging = robots.filter((r) => r.status === 'charging').length;
  const errors = robots.filter((r) => r.status === 'error').length;

  return (
    <div
      className="absolute top-4 left-4 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      <div className="bg-gray-900/80 backdrop-blur-md rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="flex divide-x divide-gray-700/50">
          <MetricTile value={total} label="Total" dotColor="bg-gray-400" />
          <MetricTile value={active} label="Active" dotColor="bg-green-400" />
          <MetricTile value={charging} label="Charging" dotColor="bg-yellow-400" />
          <MetricTile value={errors} label="Errors" dotColor="bg-red-400" />
        </div>
      </div>
    </div>
  );
}
