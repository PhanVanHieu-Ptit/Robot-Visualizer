import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHARGING_STATION_POSITIONS } from '../../constants/warehouse';

interface StationProps {
  x: number;
  z: number;
  index: number;
}

function ChargingStation({ x, z, index }: StationProps) {
  const padMatRef  = useRef<THREE.MeshStandardMaterial>(null);
  const beamMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const padGeo  = useMemo(() => new THREE.PlaneGeometry(4, 4), []);
  const beamGeo = useMemo(() => new THREE.CylinderGeometry(0.3, 0.3, 8, 16), []);

  useFrame(({ clock }) => {
    const phase = clock.elapsedTime * 1.5 + index * 0.5;
    const wave = 0.5 + 0.5 * Math.sin(phase);

    if (padMatRef.current) {
      padMatRef.current.emissiveIntensity = 0.3 + 0.3 * wave;
    }
    if (beamMatRef.current) {
      beamMatRef.current.opacity = 0.08 + 0.08 * wave;
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Glowing floor pad */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={padGeo} receiveShadow>
        <meshStandardMaterial
          ref={padMatRef}
          color="#FFB800"
          emissive="#FF8C00"
          emissiveIntensity={0.3}
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </mesh>

      {/* Vertical light beam — cylinder centered at y=4, total height 8 */}
      <mesh position={[0, 4, 0]} geometry={beamGeo}>
        <meshStandardMaterial
          ref={beamMatRef}
          color="#4488FF"
          emissive="#2255FF"
          emissiveIntensity={1.0}
          transparent
          opacity={0.12}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export function ChargingStations() {
  return (
    <>
      {CHARGING_STATION_POSITIONS.map((pos, i) => (
        <ChargingStation key={`cs-${i}`} x={pos.x} z={pos.z} index={i} />
      ))}
    </>
  );
}
