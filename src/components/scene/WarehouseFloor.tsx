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
}

export function WarehouseFloor({ width = 100, depth = 80, zones = [] }: WarehouseFloorProps) {
  const gridSize = Math.max(width, depth);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#d0d0d0" roughness={0.8} />
      </mesh>

      <gridHelper args={[gridSize, gridSize, '#a0a0a0', '#c8c8c8']} />

      {zones.map((zone) => (
        <mesh
          key={zone.id}
          position={[zone.x, 0.01, zone.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[zone.width, zone.depth]} />
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
