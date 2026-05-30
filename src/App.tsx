import { useSimulation } from './hooks/useSimulation';
import { useWebSocket } from './hooks/useWebSocket';
import { WarehouseScene } from './components/scene/WarehouseScene';
import { RobotList } from './components/ui/RobotList';
import { RobotDetail } from './components/ui/RobotDetail';
import { StatusBar } from './components/ui/StatusBar';

export default function App() {
  const { connected } = useWebSocket();
  useSimulation(!connected);

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      <StatusBar connected={connected} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <WarehouseScene />
        </div>
        <aside className="w-72 flex flex-col border-l border-gray-800 overflow-hidden bg-gray-900">
          <RobotList />
          <RobotDetail />
        </aside>
      </div>
    </div>
  );
}
