import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRobotStore } from '../../store/robotStore';
import { WarehouseFloor } from './WarehouseFloor';
import { ShelfUnit } from './ShelfUnit';
import { RobotMesh } from './RobotMesh';

export function WarehouseScene() {
  const robots = useRobotStore((s) => s.robots);
  const warehouse = useRobotStore((s) => s.warehouse);
  const selectedRobotId = useRobotStore((s) => s.selectedRobotId);
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

      <WarehouseFloor
        width={warehouse.width}
        depth={warehouse.depth}
        zones={warehouse.zones}
      />

      <ShelfUnit shelves={warehouse.shelves} />

      {robots.map((robot) => (
        <RobotMesh
          key={robot.id}
          robot={robot}
          selected={selectedRobotId === robot.id}
          onClick={() => setSelectedRobot(selectedRobotId === robot.id ? null : robot.id)}
        />
      ))}

      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        minDistance={10}
        maxDistance={200}
        enableDamping
        dampingFactor={0.05}
      />
    </Canvas>
  );
}
