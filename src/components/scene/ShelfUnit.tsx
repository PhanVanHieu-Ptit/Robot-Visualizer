import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { Shelf } from '../../types';

interface ShelfUnitProps {
  shelves: Shelf[];
}

export function ShelfUnit({ shelves }: ShelfUnitProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!meshRef.current) return;
    const matrix = new THREE.Matrix4();
    shelves.forEach((shelf, i) => {
      matrix.setPosition(shelf.x, 4, shelf.z);
      meshRef.current!.setMatrixAt(i, matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, shelves.length]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[2, 8, 1]} />
      <meshStandardMaterial color="#8B7355" roughness={0.85} />
    </instancedMesh>
  );
}
