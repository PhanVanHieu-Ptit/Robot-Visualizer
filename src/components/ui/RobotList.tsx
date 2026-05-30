import type { ReactNode } from 'react';
import { Bot, Navigation, Zap, AlertCircle } from 'lucide-react';
import { useRobotStore } from '../../store/robotStore';
import type { Robot } from '../../types';

const STATUS_ICONS: Record<Robot['status'], ReactNode> = {
  idle: <Bot size={14} className="text-blue-400" />,
  moving: <Navigation size={14} className="text-green-400" />,
  charging: <Zap size={14} className="text-yellow-400" />,
  error: <AlertCircle size={14} className="text-red-400" />,
};

const STATUS_BADGE: Record<Robot['status'], string> = {
  idle: 'bg-blue-900/50 text-blue-300',
  moving: 'bg-green-900/50 text-green-300',
  charging: 'bg-yellow-900/50 text-yellow-300',
  error: 'bg-red-900/50 text-red-300',
};

export function RobotList() {
  const robots = useRobotStore((s) => s.robots);
  const selectedRobotId = useRobotStore((s) => s.selectedRobotId);
  const setSelectedRobot = useRobotStore((s) => s.setSelectedRobot);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800">
        Fleet ({robots.length})
      </div>
      <ul>
        {robots.map((robot) => (
          <li
            key={robot.id}
            onClick={() => setSelectedRobot(selectedRobotId === robot.id ? null : robot.id)}
            className={`flex items-center gap-3 px-3 py-2 cursor-pointer border-b border-gray-800/50 hover:bg-gray-800/60 transition-colors ${
              selectedRobotId === robot.id ? 'bg-gray-800' : ''
            }`}
          >
            {STATUS_ICONS[robot.status]}
            <span className="text-sm text-white flex-1">{robot.id}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_BADGE[robot.status]}`}>
              {robot.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
