import { create } from 'zustand';
import type { Robot, Warehouse } from '../types';
import { generateWarehouse } from '../simulation/mockDataGenerator';

interface RobotStore {
  robots: Robot[];
  warehouse: Warehouse;
  selectedRobotId: string | null;
  setRobots: (robots: Robot[]) => void;
  updateRobot: (robot: Robot) => void;
  setSelectedRobot: (id: string | null) => void;
}

export const useRobotStore = create<RobotStore>((set) => ({
  robots: [],
  warehouse: generateWarehouse(),
  selectedRobotId: null,
  setRobots: (robots) => set({ robots }),
  updateRobot: (robot) =>
    set((state) => ({
      robots: state.robots.map((r) => (r.id === robot.id ? robot : r)),
    })),
  setSelectedRobot: (id) => set({ selectedRobotId: id }),
}));
