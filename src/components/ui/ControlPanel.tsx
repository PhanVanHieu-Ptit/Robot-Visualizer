import { useRobotStore } from '../../store/robotStore';

type CameraPreset = 'top' | 'isometric' | 'follow';

const CAMERA_PRESETS: { key: CameraPreset; label: string }[] = [
  { key: 'top', label: 'Top view' },
  { key: 'isometric', label: 'Isometric' },
  { key: 'follow', label: 'Follow selected' },
];

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function ToggleButton({ active, onClick, label }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

interface ControlPanelProps {
  onScreenshot: () => void;
}

export function ControlPanel({ onScreenshot }: ControlPanelProps) {
  const showPaths = useRobotStore((s) => s.showPaths);
  const showLabels = useRobotStore((s) => s.showLabels);
  const showZones = useRobotStore((s) => s.showZones);
  const simulationSpeed = useRobotStore((s) => s.simulationSpeed);
  const cameraPreset = useRobotStore((s) => s.cameraPreset);
  const togglePaths = useRobotStore((s) => s.togglePaths);
  const toggleLabels = useRobotStore((s) => s.toggleLabels);
  const toggleZones = useRobotStore((s) => s.toggleZones);
  const setSimulationSpeed = useRobotStore((s) => s.setSimulationSpeed);
  const setCameraPreset = useRobotStore((s) => s.setCameraPreset);
  const selectedRobotId = useRobotStore((s) => s.selectedRobotId);

  return (
    <div
      className={`absolute top-4 pointer-events-auto transition-all duration-300 ${
        selectedRobotId ? 'right-76' : 'right-4'
      }`}
      style={{ zIndex: 10 }}
    >
      <div className="bg-gray-900/80 backdrop-blur-md rounded-xl border border-gray-700/50 p-4 w-52 space-y-4">
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Visibility</p>
          <div className="flex flex-wrap gap-2">
            <ToggleButton active={showPaths} onClick={togglePaths} label="Show paths" />
            <ToggleButton active={showLabels} onClick={toggleLabels} label="Show labels" />
            <ToggleButton active={showZones} onClick={toggleZones} label="Show zones" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Speed</p>
            <span className="text-xs font-mono text-white">{simulationSpeed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={simulationSpeed}
            onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>0.5x</span>
            <span>3x</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Camera</p>
          <div className="flex flex-col gap-1.5">
            {CAMERA_PRESETS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setCameraPreset(key)}
                className={`px-3 py-1.5 rounded text-xs font-medium text-left transition-colors ${
                  cameraPreset === key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-1 border-t border-gray-700/40">
          <button
            onClick={onScreenshot}
            className="w-full px-3 py-1.5 rounded text-xs font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          >
            Save screenshot
          </button>
        </div>
      </div>
    </div>
  );
}
