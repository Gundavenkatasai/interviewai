import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export const FloatingPanels: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Matte Architectural Background Grid Planes */}
      <mesh position={[0, 0, -4]} receiveShadow>
        <planeGeometry args={[24, 14]} />
        <meshStandardMaterial
          color="#060608"
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>

      {/* Floating Glass Panel Left - Subtle Technical Node */}
      <mesh position={[-3.6, 1.2, -1.2]} rotation={[0, 0.35, 0]}>
        <boxGeometry args={[1.4, 2.0, 0.02]} />
        <meshPhysicalMaterial
          color="#121216"
          transparent
          opacity={0.35}
          roughness={0.15}
          metalness={0.4}
          transmission={0.6}
          thickness={0.05}
        />
      </mesh>

      {/* Floating Glass Panel Right - Subtle Telemetry Node */}
      <mesh position={[3.8, -0.6, -1.5]} rotation={[0, -0.4, 0]}>
        <boxGeometry args={[1.6, 2.2, 0.02]} />
        <meshPhysicalMaterial
          color="#121216"
          transparent
          opacity={0.3}
          roughness={0.2}
          metalness={0.4}
          transmission={0.6}
          thickness={0.05}
        />
      </mesh>

      {/* Subtle Studio Floor with soft reflective finish */}
      <mesh position={[0, -2.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 20]} />
        <meshStandardMaterial
          color="#08080a"
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>

      {/* Minimalistic Particles (Only 35 subtle dust motes for atmospheric depth, strictly not noisy) */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array([
                -4, 2, -1, 3, 3, -2, -2, -1, 1, 1, 2, 0, -3, 0, 2,
                4, 1, -1, -1, 3, -1, 2, -2, 1, -4, -1, -2, 3, -1, 0,
                0, 3.5, -2, -2.5, 1.8, 0, 2.2, 0.5, 1.5, -1.5, -0.5, 2,
                1.8, 2.8, -1.5, -3.2, -1.2, 0.5, 3.5, -1.8, -1
              ]),
              3
            ]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#ea580c"
          transparent
          opacity={0.4}
          sizeAttenuation
        />
      </points>
    </group>
  );
};
