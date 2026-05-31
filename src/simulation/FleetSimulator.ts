import type { Robot, RobotStatus, SimulationStats } from '../types';
import { CHARGING_STATION_POSITIONS } from '../constants/warehouse';

const FLOOR_X_MIN = -45;
const FLOOR_X_MAX = 45;
const FLOOR_Z_MIN = -35;
const FLOOR_Z_MAX = 35;

const SHELF_COLS = [-18, -14, -10, -6, -2, 2, 6, 10, 14, 18];
const SHELF_ROWS = [-25, -15, -5, 5, 15, 25];
const SHELF_HALF_W = 1;
const SHELF_HALF_D = 1;

const CHARGING_STATIONS = CHARGING_STATION_POSITIONS;

const ARRIVAL_THRESHOLD = 0.5;
const BATTERY_DRAIN = 0.01;
const BATTERY_CHARGE = 0.5;
const LOW_BATTERY = 20;

const INITIAL_STATUSES: RobotStatus[] = [
  'idle', 'idle', 'idle', 'idle',
  'moving', 'moving', 'moving', 'moving', 'moving',
  'moving', 'moving', 'moving', 'moving', 'moving',
  'charging', 'charging', 'charging',
  'error', 'error', 'error',
];

interface RobotSimState {
  robot: Robot;
  targetX: number;
  targetZ: number;
  nextTaskAt: number;
  isChargingRoute: boolean;
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function isInNoGoZone(x: number, z: number): boolean {
  return SHELF_ROWS.some(sz =>
    SHELF_COLS.some(sx =>
      Math.abs(x - sx) < SHELF_HALF_W && Math.abs(z - sz) < SHELF_HALF_D
    )
  );
}

function nearestStation(x: number, z: number): { x: number; z: number } {
  let nearest: { x: number; z: number } = CHARGING_STATIONS[0];
  let minDist = Infinity;
  for (const s of CHARGING_STATIONS) {
    const d = Math.hypot(s.x - x, s.z - z);
    if (d < minDist) { minDist = d; nearest = s; }
  }
  return nearest;
}

function isChargingStationPos(x: number, z: number): boolean {
  return CHARGING_STATIONS.some(s => Math.hypot(s.x - x, s.z - z) < ARRIVAL_THRESHOLD);
}

function randomFloorTarget(): { x: number; z: number } {
  let x: number, z: number;
  do {
    x = rand(FLOOR_X_MIN, FLOOR_X_MAX);
    z = rand(FLOOR_Z_MIN, FLOOR_Z_MAX);
  } while (isInNoGoZone(x, z));
  return { x, z };
}

export class FleetSimulator {
  private states: RobotSimState[];
  private simTime = 0;
  private tasksCompleted = 0;

  constructor(robotCount = 20) {
    this.states = this.initStates(robotCount);
  }

  private initStates(count: number): RobotSimState[] {
    return Array.from({ length: count }, (_, i) => {
      const status = INITIAL_STATUSES[i] ?? 'idle';
      const x = rand(FLOOR_X_MIN, FLOOR_X_MAX);
      const z = rand(FLOOR_Z_MIN, FLOOR_Z_MAX);

      let targetX = x;
      let targetZ = z;
      let isChargingRoute = false;

      if (status === 'charging') {
        const s = CHARGING_STATIONS[i % CHARGING_STATIONS.length];
        targetX = s.x;
        targetZ = s.z;
        isChargingRoute = true;
      } else if (status === 'moving') {
        const t = randomFloorTarget();
        targetX = t.x;
        targetZ = t.z;
      }

      const robot: Robot = {
        id: `robot-${String(i + 1).padStart(2, '0')}`,
        x,
        y: 0.5,
        z,
        status,
        speed: rand(1, 3),
        batteryLevel: rand(60, 100),
        taskId: status === 'moving' ? `task-${i + 1}` : undefined,
      };

      return {
        robot,
        targetX,
        targetZ,
        nextTaskAt: rand(3000, 8000),
        isChargingRoute,
      };
    });
  }

  tick(deltaMs: number): Robot[] {
    this.simTime += deltaMs;

    for (const state of this.states) {
      const { robot } = state;

      if (robot.status === 'error') continue;

      if (robot.status === 'idle') {
        if (robot.batteryLevel < LOW_BATTERY) {
          const s = nearestStation(robot.x, robot.z);
          state.targetX = s.x;
          state.targetZ = s.z;
          state.isChargingRoute = true;
          robot.status = 'moving';
        } else if (this.simTime >= state.nextTaskAt) {
          const t = randomFloorTarget();
          state.targetX = t.x;
          state.targetZ = t.z;
          state.isChargingRoute = false;
          robot.taskId = `task-${Math.floor(Math.random() * 1000)}`;
          robot.status = 'moving';
        }
        continue;
      }

      if (robot.status === 'charging') {
        robot.batteryLevel = Math.min(100, robot.batteryLevel + BATTERY_CHARGE);
        if (robot.batteryLevel >= 100) {
          robot.status = 'idle';
          state.isChargingRoute = false;
          state.nextTaskAt = this.simTime + rand(3000, 8000);
        }
        continue;
      }

      if (robot.status === 'moving') {
        robot.batteryLevel = Math.max(0, robot.batteryLevel - BATTERY_DRAIN);

        if (robot.batteryLevel < LOW_BATTERY && !state.isChargingRoute) {
          const s = nearestStation(robot.x, robot.z);
          state.targetX = s.x;
          state.targetZ = s.z;
          state.isChargingRoute = true;
        }

        const dx = state.targetX - robot.x;
        const dz = state.targetZ - robot.z;
        const dist = Math.hypot(dx, dz);

        if (dist < ARRIVAL_THRESHOLD) {
          if (state.isChargingRoute && isChargingStationPos(state.targetX, state.targetZ)) {
            robot.x = state.targetX;
            robot.z = state.targetZ;
            robot.status = 'charging';
          } else {
            robot.status = 'idle';
            robot.taskId = undefined;
            this.tasksCompleted++;
            state.nextTaskAt = this.simTime + rand(3000, 8000);
          }
          continue;
        }

        const step = (robot.speed * deltaMs) / 1000;
        const stepX = (dx / dist) * step;
        const stepZ = (dz / dist) * step;

        const nextX = clamp(robot.x + stepX, FLOOR_X_MIN, FLOOR_X_MAX);
        const nextZ = clamp(robot.z + stepZ, FLOOR_Z_MIN, FLOOR_Z_MAX);

        if (!isInNoGoZone(nextX, robot.z)) robot.x = nextX;
        if (!isInNoGoZone(robot.x, nextZ)) robot.z = nextZ;
      }
    }

    return this.getRobots();
  }

  getRobots(): Robot[] {
    return this.states.map(s => ({
      ...s.robot,
      targetX: s.targetX,
      targetZ: s.targetZ,
    }));
  }

  forceCharge(id: string): void {
    const state = this.states.find(s => s.robot.id === id);
    if (!state) return;
    const station = nearestStation(state.robot.x, state.robot.z);
    state.targetX = station.x;
    state.targetZ = station.z;
    state.isChargingRoute = true;
    state.robot.status = 'moving';
    state.robot.batteryLevel = Math.max(state.robot.batteryLevel, 1);
  }

  resetError(id: string): void {
    const state = this.states.find(s => s.robot.id === id);
    if (!state) return;
    state.robot.status = 'idle';
    state.nextTaskAt = this.simTime + 1000;
  }

  getStats(): SimulationStats {
    const robots = this.getRobots();
    const total = robots.length;
    return {
      totalRobots: total,
      active: robots.filter(r => r.status === 'moving').length,
      idle: robots.filter(r => r.status === 'idle').length,
      charging: robots.filter(r => r.status === 'charging').length,
      errors: robots.filter(r => r.status === 'error').length,
      avgBattery: total > 0
        ? robots.reduce((sum, r) => sum + r.batteryLevel, 0) / total
        : 0,
      tasksCompleted: this.tasksCompleted,
    };
  }
}
