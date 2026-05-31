import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import { useSpring } from '@react-spring/three';
import * as THREE from 'three';
import { useRobotStore } from '../../store/robotStore';
import type { Robot } from '../../types';
import { WarehouseFloor } from './WarehouseFloor';
import { ShelfUnit } from './ShelfUnit';
import { RobotMesh } from './RobotMesh';
import { TrailLines } from './TrailLines';
import { TargetIndicators } from './TargetIndicators';
import { ChargingStations } from './ChargingStations';
import { SceneEffects } from './SceneEffects';
import { DustParticles } from './DustParticles';
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

function PathLine({ robot }: { robot: Robot }) {
  const dashLine = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const mat = new THREE.LineDashedMaterial({
      color: STATUS_COLOR[robot.status] ?? '#ffffff',
      dashSize: 0.8,
      gapSize: 0.5,
      transparent: true,
      opacity: 0.6,
    });
    return new THREE.Line(geom, mat);
  }, [robot.id]);

  useFrame(() => {
    const posAttr = dashLine.geometry.attributes.position as THREE.BufferAttribute;
    posAttr.setXYZ(0, robot.x, robot.y + 0.1, robot.z);
    posAttr.setXYZ(1, robot.targetX!, robot.y + 0.1, robot.targetZ!);
    posAttr.needsUpdate = true;
    dashLine.computeLineDistances();
  });

  return <primitive object={dashLine} />;
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
          <PathLine key={r.id} robot={r} />
        ))}
    </>
  );
}

function CameraFlyIn() {
  const { camera } = useThree();
  const doneRef = useRef(false);

  const [springs] = useSpring(() => ({
    from: { pos: [0, 200, 0] as [number, number, number] },
    to:   { pos: [0, 60, 80]  as [number, number, number] },
    config: { duration: 2000 },
    onRest: () => { doneRef.current = true },
  }));

  useEffect(() => {
    camera.position.set(0, 200, 0);
  }, [camera]);

  useFrame(() => {
    if (doneRef.current) return;
    const [x, y, z] = springs.pos.get();
    camera.position.set(x, y, z);
  });

  return null;
}

function ScreenshotCapture({ triggerRef }: { triggerRef: React.MutableRefObject<(() => void) | null> }) {
  const { gl } = useThree();

  useEffect(() => {
    triggerRef.current = () => {
      const url  = gl.domElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `warehouse-${Date.now()}.png`;
      link.href = url;
      link.click();
    };
    return () => { triggerRef.current = null; };
  }, [gl, triggerRef]);

  return null;
}

function InnerScene({ screenshotTriggerRef }: { screenshotTriggerRef?: React.MutableRefObject<(() => void) | null> }) {
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
      <DustParticles />

      <CameraController />
      <CameraFlyIn />

      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        minDistance={10}
        maxDistance={200}
        enableDamping
        dampingFactor={0.05}
      />

      <SceneEffects />

      {screenshotTriggerRef && <ScreenshotCapture triggerRef={screenshotTriggerRef} />}
      {import.meta.env.DEV && <Stats />}
    </>
  );
}

export function WarehouseScene({ screenshotTriggerRef }: { screenshotTriggerRef?: React.MutableRefObject<(() => void) | null> }) {
  const setSelectedRobot = useRobotStore((s) => s.setSelectedRobot);

  return (
    <Canvas
      camera={{ position: [0, 60, 80], fov: 50 }}
      shadows
      gl={{ preserveDrawingBuffer: true }}
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

      <InnerScene screenshotTriggerRef={screenshotTriggerRef} />
    </Canvas>
  );
}
