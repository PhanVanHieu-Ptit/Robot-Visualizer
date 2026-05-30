import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRobotStore } from '../../store/robotStore';
import { WarehouseFloor } from './WarehouseFloor';
import { RobotMesh } from './RobotMesh';

export function WarehouseScene() {
  const robots = useRobotStore((s) => s.robots);
  const warehouse = useRobotStore((s) => s.warehouse);
  const selectedRobotId = useRobotStore((s) => s.selectedRobotId);
  const setSelectedRobot = useRobotStore((s) => s.setSelectedRobot);

  return (
    <Canvas
      camera={{ position: [30, 30, 30], fov: 50 }}
      shadows
      style={{ width: '100%', height: '100%' }}
      onPointerMissed={() => setSelectedRobot(null)}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[20, 30, 20]} intensity={1.5} castShadow />
      <hemisphereLight args={['#334155', '#0f172a', 0.4]} />

      <WarehouseFloor width={warehouse.width} depth={warehouse.depth} />

      {robots.map((robot) => (
        <RobotMesh
          key={robot.id}
          robot={robot}
          selected={selectedRobotId === robot.id}
          onClick={() => setSelectedRobot(selectedRobotId === robot.id ? null : robot.id)}
        />
      ))}

      <OrbitControls makeDefault />
    </Canvas>
  );
}
