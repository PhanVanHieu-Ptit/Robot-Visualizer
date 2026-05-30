interface WarehouseFloorProps {
  width?: number;
  depth?: number;
}

export function WarehouseFloor({ width = 50, depth = 50 }: WarehouseFloorProps) {
  const size = Math.max(width, depth);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <gridHelper args={[size, size, '#334155', '#1e293b']} />
    </group>
  );
}
