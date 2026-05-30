import { useEffect, useRef, useState } from 'react';
import { FleetSimulator } from '../simulation/FleetSimulator';
import { useRobotStore } from '../store/robotStore';
import type { SimulationStats } from '../types';

const INITIAL_STATS: SimulationStats = {
  totalRobots: 20,
  active: 0,
  idle: 0,
  charging: 0,
  errors: 0,
  avgBattery: 0,
  tasksCompleted: 0,
};

export function useFleetSimulation(enabled = true): SimulationStats {
  const simulatorRef = useRef<FleetSimulator | null>(null);
  const [stats, setStats] = useState<SimulationStats>(INITIAL_STATS);
  const setRobots = useRobotStore((s) => s.setRobots);

  useEffect(() => {
    if (!enabled) return;

    if (!simulatorRef.current) {
      simulatorRef.current = new FleetSimulator(20);
    }

    setRobots(simulatorRef.current.getRobots());

    const id = setInterval(() => {
      const sim = simulatorRef.current!;
      setRobots(sim.tick(100));
      setStats(sim.getStats());
    }, 100);

    return () => clearInterval(id);
  }, [enabled, setRobots]);

  return stats;
}
