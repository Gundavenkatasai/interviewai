import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface StudioMonitorProps {
  activeScreen?: "hero" | "interviewai" | "pizza_craft" | "lpulive" | "queue_analytics";
  screenContent?: React.ReactNode;
}

export const StudioMonitor: React.FC<StudioMonitorProps> = ({ activeScreen = "hero" }) => {
  const groupRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh>(null);

  // Subtle breathing idle animation
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.position.y = Math.sin(t * 0.8) * 0.04;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.4, 0]}>
      {/* Heavy Steel Base */}
      <mesh position={[0, -1.8, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.9, 1.0, 0.08, 32]} />
        <meshStandardMaterial color="#18181b" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Vertical Support Column */}
      <mesh position={[0, -0.85, -0.25]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 1.9, 24]} />
        <meshStandardMaterial color="#27272a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Monitor Hinge / Articulation Joint */}
      <mesh position={[0, 0, -0.22]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#ea580c" metalness={0.9} roughness={0.3} emissive="#ea580c" emissiveIntensity={0.2} />
      </mesh>

      {/* Monitor Outer Chassis / Bezel */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[4.6, 2.7, 0.18]} />
        <meshStandardMaterial color="#0e0e11" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Ultra-Thin Front Bezel Ring */}
      <mesh position={[0, 0.2, 0.092]}>
        <boxGeometry args={[4.52, 2.62, 0.01]} />
        <meshStandardMaterial color="#050507" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Active Screen Surface */}
      <mesh ref={screenRef} position={[0, 0.2, 0.1]}>
        <planeGeometry args={[4.44, 2.54]} />
        <meshStandardMaterial
          color={
            activeScreen === "interviewai"
              ? "#0c1524"
              : activeScreen === "pizza_craft"
              ? "#1a0f07"
              : activeScreen === "lpulive"
              ? "#180d05"
              : activeScreen === "queue_analytics"
              ? "#06130e"
              : "#0c0e14"
          }
          emissive={
            activeScreen === "interviewai"
              ? "#0284c7"
              : activeScreen === "pizza_craft" || activeScreen === "lpulive"
              ? "#ea580c"
              : activeScreen === "queue_analytics"
              ? "#10b981"
              : "#fb923c"
          }
          emissiveIntensity={0.18}
          roughness={0.15}
          metalness={0.1}
        />
      </mesh>

      {/* Subtle Power LED indicator at bottom right of bezel */}
      <mesh position={[2.1, -1.06, 0.1]}>
        <circleGeometry args={[0.02, 16]} />
        <meshBasicMaterial color="#ea580c" />
      </mesh>
    </group>
  );
};
