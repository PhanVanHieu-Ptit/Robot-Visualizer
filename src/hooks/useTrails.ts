import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRobotStore } from '../store/robotStore';

const TRAIL_LENGTH = 30;
const MIN_MOVE_DIST = 0.1;

interface RingBuffer {
  positions: THREE.Vector3[];
  count: number;
  head: number;
}

export function useTrails(): React.MutableRefObject<Map<string, THREE.Vector3[]>> {
  const ringBuffers = useRef<Map<string, RingBuffer>>(new Map());
  const trailsOut = useRef<Map<string, THREE.Vector3[]>>(new Map());

  useFrame(() => {
    const robots = useRobotStore.getState().robots;
    const buffers = ringBuffers.current;
    const out = trailsOut.current;

    for (const robot of robots) {
      if (robot.status !== 'moving') continue;

      let buf = buffers.get(robot.id);
      if (!buf) {
        buf = {
          positions: Array.from({ length: TRAIL_LENGTH }, () => new THREE.Vector3()),
          count: 0,
          head: 0,
        };
        buffers.set(robot.id, buf);
      }

      const lastIdx = (buf.head - 1 + TRAIL_LENGTH) % TRAIL_LENGTH;
      const last = buf.count > 0 ? buf.positions[lastIdx] : null;
      if (last && Math.hypot(robot.x - last.x, robot.z - last.z) < MIN_MOVE_DIST) {
        continue;
      }

      buf.positions[buf.head].set(robot.x, robot.y + 0.05, robot.z);
      buf.head = (buf.head + 1) % TRAIL_LENGTH;
      buf.count = Math.min(buf.count + 1, TRAIL_LENGTH);

      const ordered: THREE.Vector3[] = [];
      const start = buf.count < TRAIL_LENGTH ? 0 : buf.head;
      for (let i = 0; i < buf.count; i++) {
        ordered.push(buf.positions[(start + i) % TRAIL_LENGTH]);
      }
      out.set(robot.id, ordered);
    }

    // Prune robots no longer in simulation
    for (const id of buffers.keys()) {
      if (!robots.find((r) => r.id === id)) {
        buffers.delete(id);
        out.delete(id);
      }
    }
  });

  return trailsOut;
}
