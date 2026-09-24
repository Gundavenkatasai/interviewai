import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface StudioLaptopProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export const StudioLaptop: React.FC<StudioLaptopProps> = ({
  position = [1.4, -1.2, 1.8],
  rotation = [-0.15, -0.4, 0]
}) => {
  const laptopRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (laptopRef.current) {
      const t = state.clock.getElapsedTime();
      laptopRef.current.position.y = position[1] + Math.sin(t * 0.7 + 1) * 0.02;
    }
  });

  return (
    <group ref={laptopRef} position={position} rotation={rotation}>
      {/* Laptop Lower Base / Keyboard Chassis */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.05, 1.3]} />
        <meshStandardMaterial color="#1a1a1e" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Recessed Keyboard Area */}
      <mesh position={[0, 0.026, -0.15]}>
        <boxGeometry args={[1.65, 0.005, 0.7]} />
        <meshStandardMaterial color="#0d0d10" metalness={0.7} roughness={0.6} />
      </mesh>

      {/* Glass Trackpad */}
      <mesh position={[0, 0.026, 0.35]}>
        <boxGeometry args={[0.65, 0.005, 0.42]} />
        <meshStandardMaterial color="#242429" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Hinge Joint */}
      <mesh position={[0, 0.03, -0.65]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 1.8, 16]} />
        <meshStandardMaterial color="#333338" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Laptop Screen Lid (Angled back at ~110 degrees) */}
      <group position={[0, 0.04, -0.65]} rotation={[-1.15, 0, 0]}>
        {/* Screen Outer Aluminum Lid */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[1.9, 1.25, 0.04]} />
          <meshStandardMaterial color="#1a1a1e" metalness={0.88} roughness={0.25} />
        </mesh>

        {/* Screen Bezel */}
        <mesh position={[0, 0.6, 0.021]}>
          <boxGeometry args={[1.86, 1.21, 0.002]} />
          <meshStandardMaterial color="#08080a" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Active Laptop Display */}
        <mesh position={[0, 0.6, 0.023]}>
          <planeGeometry args={[1.8, 1.15]} />
          <meshStandardMaterial
            color="#080d1a"
            emissive="#0284c7"
            emissiveIntensity={0.25}
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>
      </group>
    </group>
  );
};
