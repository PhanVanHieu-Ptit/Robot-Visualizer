import { useEffect } from 'react';
import { generateRobots, simulateRobotMovement } from '../simulation/mockDataGenerator';
import { useRobotStore } from '../store/robotStore';

export function useSimulation(enabled = true, robotCount = 10, intervalMs = 500) {
  const setRobots = useRobotStore((s) => s.setRobots);

  useEffect(() => {
    if (!enabled) return;

    setRobots(generateRobots(robotCount));

    const id = setInterval(() => {
      useRobotStore.setState((state) => ({
        robots: simulateRobotMovement(state.robots),
      }));
    }, intervalMs);

    return () => clearInterval(id);
  }, [enabled, robotCount, intervalMs, setRobots]);
}
