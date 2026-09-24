import React from "react";

export const StudioLighting: React.FC = () => {
  return (
    <>
      {/* Ambient Fill */}
      <ambientLight intensity={0.4} color="#f8fafc" />

      {/* Main Overhead Studio Key Light */}
      <directionalLight
        position={[4, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
        color="#ffffff"
      />

      {/* Warm Orange Rim / Accent Light from Left (Sai's signature accent) */}
      <spotLight
        position={[-6, 4, 3]}
        angle={0.6}
        penumbra={0.8}
        intensity={2.2}
        color="#ea580c"
        distance={15}
      />

      {/* Cool Sky Blue Fill from Right */}
      <spotLight
        position={[6, 3, -2]}
        angle={0.7}
        penumbra={0.9}
        intensity={1.5}
        color="#0284c7"
        distance={15}
      />

      {/* Subtle Under-Desk Glow */}
      <pointLight position={[0, -2, 0]} intensity={0.6} color="#fb923c" distance={8} />
    </>
  );
};
