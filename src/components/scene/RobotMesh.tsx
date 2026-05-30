import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Robot } from '../../types';
import { useRobotStore } from '../../store/robotStore';

const STATUS_MAT: Record<Robot['status'], { color: string; emissive: string; emissiveIntensity: number }> = {
  idle:     { color: '#4B9EFF', emissive: '#000000', emissiveIntensity: 0.0 },
  moving:   { color: '#00D084', emissive: '#00D084', emissiveIntensity: 0.2 },
  charging: { color: '#FFB800', emissive: '#FFB800', emissiveIntensity: 0.3 },
  error:    { color: '#FF4444', emissive: '#FF4444', emissiveIntensity: 0.4 },
};

const WHEEL_POSITIONS: [number, number, number][] = [
  [-0.65, -0.3,  0.65],
  [ 0.65, -0.3,  0.65],
  [-0.65, -0.3, -0.65],
  [ 0.65, -0.3, -0.65],
];

interface RobotMeshProps {
  robot: Robot;
  isSelected: boolean;
}

export function RobotMesh({ robot, isSelected }: RobotMeshProps) {
  const setSelectedRobot = useRobotStore((s) => s.setSelectedRobot);

  const groupRef    = useRef<THREE.Group>(null);
  const domeMatRef  = useRef<THREE.MeshStandardMaterial>(null);
  const wheelRefs   = useRef<(THREE.Mesh | null)[]>([null, null, null, null]);
  const lerpTarget  = useRef(new THREE.Vector3(robot.x, robot.y, robot.z));
  const scaleTarget = useRef(new THREE.Vector3(1, 1, 1));
  const hoveredRef  = useRef(false);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;

    // Idle hover float
    const floatY = robot.status === 'idle' ? Math.sin(t * 2) * 0.05 : 0;

    // Position lerp
    lerpTarget.current.set(robot.x, robot.y + floatY, robot.z);
    groupRef.current.position.lerp(lerpTarget.current, 0.1);

    // Scale lerp (hover effect)
    scaleTarget.current.setScalar(hoveredRef.current ? 1.15 : 1.0);
    groupRef.current.scale.lerp(scaleTarget.current, 0.1);

    // Wheel rotation
    if (robot.status === 'moving') {
      wheelRefs.current.forEach((w) => {
        if (w) w.rotation.y += robot.speed * 0.05;
      });
    }

    // Emissive pulse animation
    if (domeMatRef.current) {
      if (robot.status === 'charging') {
        domeMatRef.current.emissiveIntensity = 0.1 + 0.3 * (0.5 + 0.5 * Math.sin(t * 2));
      } else if (robot.status === 'error') {
        domeMatRef.current.emissiveIntensity = 0.4 * (0.5 + 0.5 * Math.sin(t * 8));
      }
    }
  });

  const mat = STATUS_MAT[robot.status];

  return (
    <group
      ref={groupRef}
      position={[robot.x, robot.y, robot.z]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedRobot(isSelected ? null : robot.id);
      }}
      onPointerOver={() => { hoveredRef.current = true; }}
      onPointerOut={() => { hoveredRef.current = false; }}
    >
      {/* Body — main platform */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.8, 1.5]} />
        <meshStandardMaterial color={mat.color} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Top sensor dome */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <sphereGeometry args={[0.4, 12, 12]} />
        <meshStandardMaterial
          ref={domeMatRef}
          color={mat.color}
          emissive={mat.emissive}
          emissiveIntensity={mat.emissiveIntensity}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>

      {/* Antenna */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
        <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Wheels — outer group orients cylinder, inner mesh ref is animated */}
      {WHEEL_POSITIONS.map((pos, i) => (
        <group key={i} position={pos} rotation={[Math.PI / 2, 0, 0]}>
          <mesh
            ref={(el) => { wheelRefs.current[i] = el; }}
            castShadow
          >
            <cylinderGeometry args={[0.25, 0.25, 0.15, 8]} />
            <meshStandardMaterial color="#222222" roughness={0.9} metalness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.2, 32]} />
          <meshStandardMaterial
            color="#4B9EFF"
            emissive="#4B9EFF"
            emissiveIntensity={1.0}
            transparent
            opacity={0.8}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
