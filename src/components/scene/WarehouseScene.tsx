import { useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useRobotStore } from '../../store/robotStore';
import { WarehouseFloor } from './WarehouseFloor';
import { ShelfUnit } from './ShelfUnit';
import { RobotMesh } from './RobotMesh';
import { TrailLines } from './TrailLines';
import { TargetIndicators } from './TargetIndicators';
import { ChargingStations } from './ChargingStations';
import { useTrails } from '../../hooks/useTrails';

const STATUS_COLOR: Record<string, string> = {
  idle: '#4B9EFF',
  moving: '#00D084',
  charging: '#FFB800',
  error: '#FF4444',
};

function CameraController() {
  const { camera, controls } = useThree();
  const cameraPreset = useRobotStore((s) => s.cameraPreset);
  const selectedRobotId = useRobotStore((s) => s.selectedRobotId);
  const robots = useRobotStore((s) => s.robots);
  const prevPreset = useRef(cameraPreset);

  useEffect(() => {
    if (cameraPreset === prevPreset.current && cameraPreset !== 'follow') return;
    prevPreset.current = cameraPreset;

    const orb = controls as unknown as { target: THREE.Vector3; update: () => void } | null;
    if (!orb) return;

    if (cameraPreset === 'top') {
      camera.position.set(0, 150, 0.1);
      orb.target.set(0, 0, 0);
      orb.update();
    } else if (cameraPreset === 'isometric') {
      camera.position.set(80, 80, 80);
      orb.target.set(0, 0, 0);
      orb.update();
    }
  }, [cameraPreset, camera, controls]);

  useFrame(() => {
    if (cameraPreset !== 'follow') return;
    const robot = robots.find((r) => r.id === selectedRobotId);
    if (!robot) return;
    const orb = controls as unknown as { target: THREE.Vector3; update: () => void } | null;
    if (!orb) return;

    const targetPos = new THREE.Vector3(robot.x, robot.y, robot.z);
    camera.position.lerp(new THREE.Vector3(robot.x, robot.y + 30, robot.z + 40), 0.05);
    orb.target.lerp(targetPos, 0.05);
    orb.update();
  });

  return null;
}

function PathLines() {
  const robots = useRobotStore((s) => s.robots);
  const showPaths = useRobotStore((s) => s.showPaths);

  if (!showPaths) return null;

  return (
    <>
      {robots
        .filter(
          (r) =>
            r.status === 'moving' &&
            r.targetX !== undefined &&
            r.targetZ !== undefined
        )
        .map((r) => (
          <Line
            key={r.id}
            points={[
              [r.x, r.y + 0.1, r.z],
              [r.targetX!, r.y + 0.1, r.targetZ!],
            ]}
            color={STATUS_COLOR[r.status] ?? '#ffffff'}
            lineWidth={1}
            dashed
            dashSize={0.8}
            gapSize={0.5}
            transparent
            opacity={0.6}
          />
        ))}
    </>
  );
}

function InnerScene() {
  const trailsRef = useTrails();
  const warehouse = useRobotStore((s) => s.warehouse);
  const showZones = useRobotStore((s) => s.showZones);

  return (
    <>
      <WarehouseFloor
        width={warehouse.width}
        depth={warehouse.depth}
        zones={warehouse.zones}
        showZones={showZones}
      />

      <ShelfUnit shelves={warehouse.shelves} />

      <RobotMesh />

      <TrailLines trailsRef={trailsRef} />
      <TargetIndicators />
      <ChargingStations />

      <PathLines />
      <CameraController />

      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        minDistance={10}
        maxDistance={200}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

export function WarehouseScene() {
  const setSelectedRobot = useRobotStore((s) => s.setSelectedRobot);

  return (
    <Canvas
      camera={{ position: [0, 60, 80], fov: 50 }}
      shadows
      style={{ width: '100%', height: '100%' }}
      onPointerMissed={() => setSelectedRobot(null)}
    >
      <fog attach="fog" args={['#d0d8e0', 150, 300]} />

      <ambientLight intensity={0.4} />

      <directionalLight
        position={[40, 50, 30]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      <pointLight position={[-30, 15, -25]} intensity={0.6} color="#fff5e0" />
      <pointLight position={[ 30, 15, -25]} intensity={0.6} color="#fff5e0" />
      <pointLight position={[-30, 15,  25]} intensity={0.6} color="#fff5e0" />
      <pointLight position={[ 30, 15,  25]} intensity={0.6} color="#fff5e0" />

      <InnerScene />
    </Canvas>
  );
}
