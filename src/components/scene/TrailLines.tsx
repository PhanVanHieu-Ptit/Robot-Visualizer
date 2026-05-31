import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRobotStore } from '../../store/robotStore';
import type { Robot } from '../../types';

const TRAIL_LENGTH = 30;

const STATUS_COLOR_HEX: Record<Robot['status'], string> = {
  idle:     '#4B9EFF',
  moving:   '#00D084',
  charging: '#FFB800',
  error:    '#FF4444',
};

interface LineData {
  geometry: THREE.BufferGeometry;
  posArray: Float32Array;
  colArray: Float32Array;
  line: THREE.Line;
}

interface TrailLinesProps {
  trailsRef: React.MutableRefObject<Map<string, THREE.Vector3[]>>;
}

export function TrailLines({ trailsRef }: TrailLinesProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lineDataRef = useRef<Map<string, LineData>>(new Map());
  const colorScratch = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    if (!groupRef.current) return;
    const trails = trailsRef.current;
    const lineData = lineDataRef.current;
    const group = groupRef.current;
    const robots = useRobotStore.getState().robots;

    // Create new line objects for newly seen robots
    for (const robotId of trails.keys()) {
      if (!lineData.has(robotId)) {
        const posArray = new Float32Array(TRAIL_LENGTH * 3);
        const colArray = new Float32Array(TRAIL_LENGTH * 3);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colArray, 3));
        geometry.setDrawRange(0, 0);

        const material = new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.8,
          depthWrite: false,
        });
        const line = new THREE.Line(geometry, material);
        group.add(line);
        lineData.set(robotId, { geometry, posArray, colArray, line });
      }
    }

    // Update geometry data for each trail
    for (const [robotId, data] of lineData) {
      const positions = trails.get(robotId);
      if (!positions || positions.length < 2) {
        data.geometry.setDrawRange(0, 0);
        continue;
      }

      const robot = robots.find((r) => r.id === robotId);
      const hexColor = robot ? (STATUS_COLOR_HEX[robot.status] ?? '#ffffff') : '#ffffff';
      colorScratch.set(hexColor);

      const count = Math.min(positions.length, TRAIL_LENGTH);
      for (let i = 0; i < count; i++) {
        const p = positions[i];
        const t = i / (count - 1); // 0=oldest(tail), 1=newest(head)
        data.posArray[i * 3]     = p.x;
        data.posArray[i * 3 + 1] = p.y;
        data.posArray[i * 3 + 2] = p.z;
        data.colArray[i * 3]     = colorScratch.r * t;
        data.colArray[i * 3 + 1] = colorScratch.g * t;
        data.colArray[i * 3 + 2] = colorScratch.b * t;
      }

      data.geometry.attributes.position.needsUpdate = true;
      data.geometry.attributes.color.needsUpdate = true;
      data.geometry.setDrawRange(0, count);
    }

    // Remove lines for robots no longer in trails
    for (const [robotId, data] of lineData) {
      if (!trails.has(robotId)) {
        group.remove(data.line);
        data.geometry.dispose();
        (data.line.material as THREE.Material).dispose();
        lineData.delete(robotId);
      }
    }
  });

  return <group ref={groupRef} />;
}
