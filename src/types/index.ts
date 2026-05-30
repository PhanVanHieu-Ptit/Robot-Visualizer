export type RobotStatus = 'idle' | 'moving' | 'charging' | 'error';

export interface Robot {
  id: string;
  x: number;
  y: number;
  z: number;
  status: RobotStatus;
  speed: number;
  batteryLevel: number;
  taskId?: string;
}

export interface Shelf {
  id: string;
  x: number;
  y: number;
  z: number;
  capacity: number;
}

export interface Zone {
  id: string;
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  type: string;
}

export interface Warehouse {
  width: number;
  depth: number;
  height: number;
  shelves: Shelf[];
  zones: Zone[];
}
