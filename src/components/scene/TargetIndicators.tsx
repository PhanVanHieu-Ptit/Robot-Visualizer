import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRobotStore } from '../../store/robotStore';
import type { Robot } from '../../types';

const STATUS_COLOR: Record<Robot['status'], string> = {
  idle:     '#4B9EFF',
  moving:   '#00D084',
  charging: '#FFB800',
  error:    '#FF4444',
};

function TargetRing({ robot }: { robot: Robot }) {
  const ringRef = useRef<THREE.Mesh>(null);

  const targetX = robot.targetX!;
  const targetZ = robot.targetZ!;
  const color = STATUS_COLOR[robot.status];

  useFrame(({ clock }) => {
    if (ringRef.current) {
      const pulse = 1.0 + 0.1 * Math.sin(clock.elapsedTime * Math.PI * 4);
      ringRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <mesh
      ref={ringRef}
      position={[targetX, 0.02, targetZ]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[0.8, 1.2, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        transparent
        opacity={0.7}
        depthWrite={false}
      />
    </mesh>
  );
}

export function TargetIndicators() {
  const robots = useRobotStore((s) => s.robots);

  const targets = robots.filter(
    (r) => r.status === 'moving' && r.targetX !== undefined && r.targetZ !== undefined
  );

  return (
    <>
      {targets.map((robot) => (
        <TargetRing key={robot.id} robot={robot} />
      ))}
    </>
  );
}
