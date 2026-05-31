import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useRobotStore } from '../../store/robotStore';
import type { Robot } from '../../types';
import { CHARGING_STATION_POSITIONS } from '../../constants/warehouse';

const MAX_ROBOTS = 200;

const STATUS_COLOR_HEX: Record<Robot['status'], string> = {
  idle:     '#4B9EFF',
  moving:   '#00D084',
  charging: '#FFB800',
  error:    '#FF4444',
};

const WHEEL_OFFSETS: [number, number, number][] = [
  [-0.65, -0.3,  0.65],
  [ 0.65, -0.3,  0.65],
  [-0.65, -0.3, -0.65],
  [ 0.65, -0.3, -0.65],
];

function getSnapTarget(robot: Robot): { x: number; z: number } | null {
  if (robot.status !== 'charging') return null;
  return (
    CHARGING_STATION_POSITIONS.find(
      (s) => Math.hypot(s.x - robot.x, s.z - robot.z) < 2.0
    ) ?? null
  );
}

function RobotLabels() {
  const robots = useRobotStore((s) => s.robots);
  const showLabels = useRobotStore((s) => s.showLabels);
  const { camera } = useThree();
  const camPos = useRef(new THREE.Vector3());

  if (!showLabels) return null;

  return (
    <>
      {robots.map((robot) => {
        camPos.current.copy(camera.position);
        const dist = camPos.current.distanceTo(
          new THREE.Vector3(robot.x, robot.y, robot.z)
        );
        if (dist > 50) return null;

        const batteryColor =
          robot.batteryLevel > 50 ? '#4ade80'
          : robot.batteryLevel > 20 ? '#facc15'
          : '#f87171';

        return (
          <Html
            key={robot.id}
            position={[robot.x, robot.y + 2.5, robot.z]}
            center
            distanceFactor={8}
            zIndexRange={[1, 2]}
          >
            <div
              style={{
                background: 'rgba(17, 24, 39, 0.85)',
                border: '1px solid rgba(75, 85, 99, 0.6)',
                borderRadius: '6px',
                padding: '2px 7px',
                fontSize: '10px',
                color: '#e5e7eb',
                whiteSpace: 'nowrap',
                backdropFilter: 'blur(4px)',
                pointerEvents: 'none',
                lineHeight: '1.6',
              }}
            >
              <span style={{ fontWeight: 600 }}>{robot.id}</span>
              <span style={{ color: '#9ca3af', margin: '0 4px' }}>·</span>
              <span style={{ color: batteryColor }}>{robot.batteryLevel.toFixed(0)}%</span>
            </div>
          </Html>
        );
      })}
    </>
  );
}

function SelectionRing() {
  const selectedRobotId = useRobotStore((s) => s.selectedRobotId);
  const robots = useRobotStore((s) => s.robots);
  const robot = robots.find((r) => r.id === selectedRobotId);
  if (!robot) return null;
  return (
    <mesh
      position={[robot.x, robot.y - 0.45, robot.z]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
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
  );
}

function _RobotMesh() {
  const bodyMeshRef    = useRef<THREE.InstancedMesh>(null);
  const domeMeshRef    = useRef<THREE.InstancedMesh>(null);
  const antennaMeshRef = useRef<THREE.InstancedMesh>(null);
  const wheelMeshRef   = useRef<THREE.InstancedMesh>(null);

  // Pre-allocated scratch objects — never recreated inside useFrame
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const hsl   = useMemo(() => ({ h: 0, s: 0, l: 0 }), []);

  const lerpedPos  = useRef<Map<string, { x: number; y: number; z: number }>>(new Map());
  const hoveredIdx = useRef<number | null>(null);

  // LOD + frustum culling scratch objects
  const { camera } = useThree();
  const camDistRef       = useRef(0);
  const frustum          = useMemo(() => new THREE.Frustum(), []);
  const projScreenMatrix = useMemo(() => new THREE.Matrix4(), []);
  const frustumPt        = useMemo(() => new THREE.Vector3(), []);

  const setSelectedRobot = useRobotStore((s) => s.setSelectedRobot);

  // Hide all unused slots on mount (prevents ghost robots at origin)
  useEffect(() => {
    const meshes = [bodyMeshRef, domeMeshRef, antennaMeshRef];
    dummy.scale.setScalar(0);
    dummy.updateMatrix();

    for (const meshRef of meshes) {
      if (!meshRef.current) continue;
      for (let i = 0; i < MAX_ROBOTS; i++) {
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (wheelMeshRef.current) {
      for (let i = 0; i < MAX_ROBOTS * 4; i++) {
        wheelMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      wheelMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    dummy.scale.setScalar(1);
  }, [dummy]);

  useFrame(({ clock }) => {
    const robots = useRobotStore.getState().robots;
    const t = clock.elapsedTime;

    if (!bodyMeshRef.current || !domeMeshRef.current ||
        !antennaMeshRef.current || !wheelMeshRef.current) return;

    // LOD: hide detail meshes when camera is far from scene centre
    camDistRef.current = camera.position.length();
    const isLOD = camDistRef.current > 80;

    // Frustum culling: update once per frame
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreenMatrix);

    robots.forEach((robot, i) => {
      if (i >= MAX_ROBOTS) return;

      // Initialize lerped position on first encounter
      if (!lerpedPos.current.has(robot.id)) {
        lerpedPos.current.set(robot.id, { x: robot.x, y: robot.y, z: robot.z });
      }
      const lp = lerpedPos.current.get(robot.id)!;

      // Charging snap: visually pull robot to nearest station when within 2 units
      const snap = getSnapTarget(robot);
      const tgtX = snap ? snap.x : robot.x;
      const tgtZ = snap ? snap.z : robot.z;
      const floatY = robot.status === 'idle' ? Math.sin(t * 2 + i) * 0.05 : 0;
      const tgtY = robot.y + floatY;

      lp.x += (tgtX - lp.x) * 0.1;
      lp.y += (tgtY - lp.y) * 0.1;
      lp.z += (tgtZ - lp.z) * 0.1;

      // Skip robots outside camera frustum
      frustumPt.set(lp.x, lp.y, lp.z);
      if (!frustum.containsPoint(frustumPt)) {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        bodyMeshRef.current!.setMatrixAt(i, dummy.matrix);
        if (!isLOD) {
          domeMeshRef.current!.setMatrixAt(i, dummy.matrix);
          antennaMeshRef.current!.setMatrixAt(i, dummy.matrix);
          for (let w = 0; w < 4; w++) wheelMeshRef.current!.setMatrixAt(i * 4 + w, dummy.matrix);
        }
        dummy.scale.setScalar(1);
        return;
      }

      const isHovered = hoveredIdx.current === i;
      const scaleVal  = isHovered ? 1.15 : 1.0;

      // Body
      dummy.position.set(lp.x, lp.y, lp.z);
      dummy.scale.setScalar(scaleVal);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      bodyMeshRef.current!.setMatrixAt(i, dummy.matrix);

      // Status color with pulse simulation via HSL lightness
      color.set(STATUS_COLOR_HEX[robot.status]);
      if (robot.status === 'charging') {
        color.getHSL(hsl);
        color.setHSL(hsl.h, hsl.s, hsl.l * (0.7 + 0.3 * (0.5 + 0.5 * Math.sin(t * 2))));
      } else if (robot.status === 'error') {
        color.getHSL(hsl);
        color.setHSL(hsl.h, hsl.s, hsl.l * (0.5 + 0.5 * Math.sin(t * 8)));
      }
      bodyMeshRef.current!.setColorAt(i, color);

      // Dome (offset up from body center)
      dummy.position.set(lp.x, lp.y + 0.6 * scaleVal, lp.z);
      dummy.scale.setScalar(scaleVal);
      dummy.updateMatrix();
      domeMeshRef.current!.setMatrixAt(i, dummy.matrix);
      domeMeshRef.current!.setColorAt(i, color);

      // Antenna
      dummy.position.set(lp.x, lp.y + 1.1 * scaleVal, lp.z);
      dummy.scale.setScalar(scaleVal);
      dummy.updateMatrix();
      antennaMeshRef.current!.setMatrixAt(i, dummy.matrix);

      // Wheels (4 per robot, indices i*4 … i*4+3)
      const wheelSpin = robot.status === 'moving' ? t * robot.speed * 3 : 0;
      WHEEL_OFFSETS.forEach((offset, w) => {
        const wi = i * 4 + w;
        dummy.position.set(
          lp.x + offset[0] * scaleVal,
          lp.y + offset[1] * scaleVal,
          lp.z + offset[2] * scaleVal,
        );
        dummy.scale.setScalar(scaleVal);
        dummy.rotation.set(Math.PI / 2, wheelSpin, 0);
        dummy.updateMatrix();
        wheelMeshRef.current!.setMatrixAt(wi, dummy.matrix);
      });
    });

    bodyMeshRef.current.instanceMatrix.needsUpdate    = true;
    domeMeshRef.current.instanceMatrix.needsUpdate    = true;
    antennaMeshRef.current.instanceMatrix.needsUpdate = true;
    wheelMeshRef.current.instanceMatrix.needsUpdate   = true;

    if (bodyMeshRef.current.instanceColor)   bodyMeshRef.current.instanceColor.needsUpdate   = true;
    if (domeMeshRef.current.instanceColor)   domeMeshRef.current.instanceColor.needsUpdate   = true;

    // LOD: suppress detail geometry draws at distance
    domeMeshRef.current.count    = isLOD ? 0 : robots.length;
    antennaMeshRef.current.count = isLOD ? 0 : robots.length;
    wheelMeshRef.current.count   = isLOD ? 0 : robots.length * 4;
  });

  return (
    <>
      {/* Body */}
      <instancedMesh
        ref={bodyMeshRef}
        args={[undefined, undefined, MAX_ROBOTS]}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          if (e.instanceId === undefined) return;
          const robots = useRobotStore.getState().robots;
          const robot = robots[e.instanceId];
          if (!robot) return;
          const current = useRobotStore.getState().selectedRobotId;
          setSelectedRobot(current === robot.id ? null : robot.id);
        }}
        onPointerOver={(e) => {
          if (e.instanceId !== undefined) hoveredIdx.current = e.instanceId;
        }}
        onPointerOut={() => { hoveredIdx.current = null; }}
      >
        <boxGeometry args={[1.5, 0.8, 1.5]} />
        <meshStandardMaterial metalness={0.6} roughness={0.3} />
      </instancedMesh>

      {/* Sensor dome */}
      <instancedMesh ref={domeMeshRef} args={[undefined, undefined, MAX_ROBOTS]} castShadow>
        <sphereGeometry args={[0.4, 12, 12]} />
        <meshStandardMaterial metalness={0.4} roughness={0.3} />
      </instancedMesh>

      {/* Antenna */}
      <instancedMesh ref={antennaMeshRef} args={[undefined, undefined, MAX_ROBOTS]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
        <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
      </instancedMesh>

      {/* Wheels — 4 per robot */}
      <instancedMesh ref={wheelMeshRef} args={[undefined, undefined, MAX_ROBOTS * 4]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 8]} />
        <meshStandardMaterial color="#222222" roughness={0.9} metalness={0.1} />
      </instancedMesh>

      <RobotLabels />
      <SelectionRing />
    </>
  );
}

export const RobotMesh = React.memo(_RobotMesh, () => true);
