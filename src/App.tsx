import { Suspense, useEffect, useRef } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useFleetSimulation } from './hooks/useFleetSimulation';
import { useRobotStore } from './store/robotStore';
import { WarehouseScene } from './components/scene/WarehouseScene';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { FleetStatusHUD } from './components/ui/FleetStatusHUD';
import { ControlPanel } from './components/ui/ControlPanel';
import { TimelineBar } from './components/ui/TimelineBar';
import { RobotDetailPanel } from './components/ui/RobotDetailPanel';

const isDemoMode = new URLSearchParams(window.location.search).get('demo') === 'true';

export default function App() {
  const { connected } = useWebSocket();
  const { stats, forceCharge, resetError } = useFleetSimulation(!connected, isDemoMode);
  const pushTimelinePoint = useRobotStore((s) => s.pushTimelinePoint);

  const prevTasksRef      = useRef(0);
  const screenshotRef     = useRef<(() => void) | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const delta = stats.tasksCompleted - prevTasksRef.current;
      prevTasksRef.current = stats.tasksCompleted;
      pushTimelinePoint({ time: Date.now(), tasksPerSecond: Math.max(0, delta) });
    }, 1000);
    return () => clearInterval(id);
  }, [stats.tasksCompleted, pushTimelinePoint]);

  return (
    <div className="w-screen h-screen relative bg-gray-950 text-white overflow-hidden">
      <Suspense fallback={<LoadingScreen />}>
        <WarehouseScene screenshotTriggerRef={screenshotRef} />
      </Suspense>
      <FleetStatusHUD />
      <ControlPanel onScreenshot={() => screenshotRef.current?.()} />
      <TimelineBar />
      <RobotDetailPanel onForceCharge={forceCharge} onResetError={resetError} />
    </div>
  );
}
