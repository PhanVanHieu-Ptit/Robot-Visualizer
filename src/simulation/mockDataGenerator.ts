import type { Robot, RobotStatus, Shelf, Warehouse, Zone } from '../types';

export function generateWarehouse(): Warehouse {
  const shelves: Shelf[] = Array.from({ length: 20 }, (_, i) => ({
    id: `shelf-${i}`,
    x: (i % 5) * 8 - 16,
    y: 0,
    z: Math.floor(i / 5) * 8 - 16,
    capacity: 100,
  }));

  const zones: Zone[] = [
    { id: 'zone-charging', name: 'Charging', x: -22, z: -22, width: 6, depth: 6, type: 'charging' },
    { id: 'zone-entry', name: 'Entry', x: 18, z: -22, width: 8, depth: 6, type: 'entry' },
    { id: 'zone-staging', name: 'Staging', x: -22, z: 18, width: 8, depth: 8, type: 'staging' },
  ];

  return { width: 50, depth: 50, height: 10, shelves, zones };
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
