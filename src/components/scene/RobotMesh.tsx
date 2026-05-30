import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import type { Robot } from '../../types';

const STATUS_COLORS: Record<Robot['status'], string> = {
  idle: '#3b82f6',
  moving: '#22c55e',
  charging: '#eab308',
  error: '#ef4444',
};

interface RobotMeshProps {
  robot: Robot;
  selected: boolean;
  onClick: () => void;
}

export function RobotMesh({ robot, selected, onClick }: RobotMeshProps) {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.set(robot.x, robot.y, robot.z);
  });

  return (
    <mesh
      ref={meshRef}
      position={[robot.x, robot.y, robot.z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      castShadow
    >
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial
        color={STATUS_COLORS[robot.status]}
        emissive={STATUS_COLORS[robot.status]}
        emissiveIntensity={selected ? 0.6 : 0.15}
      />
    </mesh>
  );
}
