import { useMemo } from 'react';
import * as THREE from 'three';
import type { Zone } from '../../types';

const ZONE_COLORS: Record<string, string> = {
  charging: '#3b82f6',
  storage:  '#6b7280',
  dispatch: '#22c55e',
};

interface WarehouseFloorProps {
  width?: number;
  depth?: number;
  zones?: Zone[];
  showZones?: boolean;
}

export function WarehouseFloor({ width = 100, depth = 80, zones = [], showZones = true }: WarehouseFloorProps) {
  const gridSize = Math.max(width, depth);
  const floorGeo = useMemo(() => new THREE.PlaneGeometry(width, depth), [width, depth]);
  const zoneGeos = useMemo(() => zones.map((z) => new THREE.PlaneGeometry(z.width, z.depth)), [zones]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={floorGeo} receiveShadow>
        <meshStandardMaterial color="#d0d0d0" roughness={0.8} />
      </mesh>

      <gridHelper args={[gridSize, gridSize, '#a0a0a0', '#c8c8c8']} />

      {showZones && zones.map((zone, i) => (
        <mesh
          key={zone.id}
          position={[zone.x, 0.01, zone.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          geometry={zoneGeos[i]}
        >
          <meshStandardMaterial
            color={ZONE_COLORS[zone.type] ?? '#ffffff'}
            opacity={0.25}
            transparent
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
