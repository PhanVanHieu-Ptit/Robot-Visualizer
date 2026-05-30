import type { Robot, RobotStatus, Shelf, Warehouse, Zone } from '../types';

const SHELF_COLS = [-18, -14, -10, -6, -2, 2, 6, 10, 14, 18];
const SHELF_ROWS = [-25, -15, -5, 5, 15, 25];

export function generateWarehouse(): Warehouse {
  const shelves: Shelf[] = SHELF_ROWS.flatMap((z, rowIdx) =>
    SHELF_COLS.map((x, colIdx) => ({
      id: `shelf-${rowIdx}-${colIdx}`,
      x,
      y: 0,
      z,
      capacity: 100,
    })),
  );

  const zones: Zone[] = [
    { id: 'zone-charging', name: 'Charging', x: -38, z: -30, width: 14, depth: 12, type: 'charging' },
    { id: 'zone-storage',  name: 'Storage',  x: 0,   z: 0,   width: 60, depth: 52, type: 'storage'  },
    { id: 'zone-dispatch', name: 'Dispatch', x: 38,  z: 30,  width: 14, depth: 12, type: 'dispatch' },
  ];

  return { width: 100, depth: 80, height: 10, shelves, zones };
}

const STATUSES: RobotStatus[] = ['idle', 'moving', 'charging', 'error'];

export function generateRobots(count: number): Robot[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `robot-${String(i + 1).padStart(2, '0')}`,
    x: (Math.random() - 0.5) * 40,
    y: 0.5,
    z: (Math.random() - 0.5) * 40,
    status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
    speed: Math.random() * 2 + 0.5,
    batteryLevel: Math.random() * 100,
    taskId: Math.random() > 0.5 ? `task-${Math.floor(Math.random() * 100)}` : undefined,
  }));
}

export function simulateRobotMovement(robots: Robot[]): Robot[] {
  return robots.map((robot) => {
    if (robot.status !== 'moving') return robot;
    return {
      ...robot,
      x: Math.max(-24, Math.min(24, robot.x + (Math.random() - 0.5) * robot.speed)),
      z: Math.max(-24, Math.min(24, robot.z + (Math.random() - 0.5) * robot.speed)),
      batteryLevel: Math.max(0, robot.batteryLevel - 0.05),
    };
  });
}
