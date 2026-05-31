import { create } from 'zustand';
import type { Robot, Warehouse, TimelinePoint } from '../types';
import { generateWarehouse } from '../simulation/mockDataGenerator';

type CameraPreset = 'top' | 'isometric' | 'follow';

interface RobotStore {
  robots: Robot[];
  warehouse: Warehouse;
  selectedRobotId: string | null;
  setRobots: (robots: Robot[]) => void;
  updateRobot: (robot: Robot) => void;
  setSelectedRobot: (id: string | null) => void;

  showPaths: boolean;
  showLabels: boolean;
  showZones: boolean;
  simulationSpeed: number;
  cameraPreset: CameraPreset;
  timelineHistory: TimelinePoint[];

  togglePaths: () => void;
  toggleLabels: () => void;
  toggleZones: () => void;
  setSimulationSpeed: (speed: number) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  pushTimelinePoint: (point: TimelinePoint) => void;

  forceCharge: (id: string) => void;
  resetError: (id: string) => void;
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

  showPaths: false,
  showLabels: true,
  showZones: true,
  simulationSpeed: 1,
  cameraPreset: 'isometric',
  timelineHistory: [],

  togglePaths: () => set((s) => ({ showPaths: !s.showPaths })),
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  toggleZones: () => set((s) => ({ showZones: !s.showZones })),
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),
  setCameraPreset: (preset) => set({ cameraPreset: preset }),
  pushTimelinePoint: (point) =>
    set((s) => ({
      timelineHistory: [...s.timelineHistory.slice(-59), point],
    })),

  forceCharge: (id) =>
    set((s) => ({
      robots: s.robots.map((r) =>
        r.id === id ? { ...r, status: 'charging' as const, batteryLevel: Math.max(r.batteryLevel, 1) } : r
      ),
    })),
  resetError: (id) =>
    set((s) => ({
      robots: s.robots.map((r) =>
        r.id === id ? { ...r, status: 'idle' as const } : r
      ),
    })),
}));
