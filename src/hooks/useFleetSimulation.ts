import { useCallback, useEffect, useRef, useState } from 'react';
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

export function useFleetSimulation(enabled = true, isDemoMode = false) {
  const simulatorRef = useRef<FleetSimulator | null>(null);
  const [stats, setStats] = useState<SimulationStats>(INITIAL_STATS);
  const setRobots = useRobotStore((s) => s.setRobots);
  const simulationSpeed = useRobotStore((s) => s.simulationSpeed);

  useEffect(() => {
    if (!enabled) return;

    if (!simulatorRef.current) {
      simulatorRef.current = new FleetSimulator(20);
    }

    setRobots(simulatorRef.current.getRobots());

    const id = setInterval(() => {
      const sim = simulatorRef.current!;
      setRobots(sim.tick(100 * simulationSpeed));
      setStats(sim.getStats());
    }, 100);

    return () => clearInterval(id);
  }, [enabled, setRobots, simulationSpeed]);

  useEffect(() => {
    if (!enabled || !isDemoMode) return;

    // t=5s: 3 robots simultaneously route to charging
    const t1 = setTimeout(() => {
      const sim = simulatorRef.current;
      if (!sim) return;
      const ids = sim.getRobotIds();
      [ids[0], ids[1], ids[2]].forEach(id => sim.forceCharge(id));
    }, 5000);

    // t=10s: 1 robot triggers error state, 2 others reroute to charging
    const t2 = setTimeout(() => {
      const sim = simulatorRef.current;
      if (!sim) return;
      const ids = sim.getRobotIds();
      sim.triggerError(ids[3]);
      [ids[4], ids[5]].forEach(id => sim.forceCharge(id));
    }, 10000);

    // t=20s: high-activity burst — all idle robots start moving
    const t3 = setTimeout(() => {
      simulatorRef.current?.triggerActivityBurst();
    }, 20000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [enabled, isDemoMode]);

  const forceCharge = useCallback((id: string) => {
    simulatorRef.current?.forceCharge(id);
  }, []);

  const resetError = useCallback((id: string) => {
    simulatorRef.current?.resetError(id);
  }, []);

  return { stats, forceCharge, resetError };
}
