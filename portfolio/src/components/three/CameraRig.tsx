import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

interface CameraRigProps {
  scrollProgress: number; // 0 to 1
  mouse: { normalizedX: number; normalizedY: number };
}

export const CameraRig: React.FC<CameraRigProps> = ({ scrollProgress, mouse }) => {
  const { camera } = useThree();
  const currentPos = useRef(new THREE.Vector3(0, 0.4, 4.6));
  const currentTarget = useRef(new THREE.Vector3(0, 0.2, 0));

  useFrame((_, delta) => {
    // Determine target camera coordinates based on scroll progress
    let targetX = 0;
    let targetY = 0.4;
    let targetZ = 4.6;

    let lookX = 0;
    let lookY = 0.2;
    let lookZ = 0;

    if (scrollProgress < 0.2) {
      // Hero section: frontal view with mouse parallax
      targetX = 0 - mouse.normalizedX * 0.35;
      targetY = 0.4 + mouse.normalizedY * 0.25;
      targetZ = 4.6;
    } else if (scrollProgress < 0.4) {
      // About section: shift camera left, look toward right
      const t = (scrollProgress - 0.2) / 0.2;
      targetX = THREE.MathUtils.lerp(0, -0.9, t) - mouse.normalizedX * 0.2;
      targetY = THREE.MathUtils.lerp(0.4, 0.3, t);
      targetZ = THREE.MathUtils.lerp(4.6, 4.2, t);
      lookX = THREE.MathUtils.lerp(0, 0.4, t);
    } else if (scrollProgress < 0.6) {
      // Skills section: balanced view showing workstation and floating geometry
      const t = (scrollProgress - 0.4) / 0.2;
      targetX = THREE.MathUtils.lerp(-0.9, 0.7, t);
      targetY = THREE.MathUtils.lerp(0.3, 0.5, t);
      targetZ = THREE.MathUtils.lerp(4.2, 4.0, t);
      lookX = THREE.MathUtils.lerp(0.4, -0.2, t);
    } else if (scrollProgress < 0.85) {
      // Projects section: zoom closer into the monitor screen
      const t = (scrollProgress - 0.6) / 0.25;
      targetX = THREE.MathUtils.lerp(0.7, 0, t) - mouse.normalizedX * 0.15;
      targetY = THREE.MathUtils.lerp(0.5, 0.2, t) + mouse.normalizedY * 0.1;
      targetZ = THREE.MathUtils.lerp(4.0, 3.2, t);
      lookX = 0;
      lookY = 0.2;
    } else {
      // Contact section: serene cinematic pull back
      const t = (scrollProgress - 0.85) / 0.15;
      targetX = THREE.MathUtils.lerp(0, 0, t);
      targetY = THREE.MathUtils.lerp(0.2, 0.7, t);
      targetZ = THREE.MathUtils.lerp(3.2, 5.2, t);
      lookY = 0.3;
    }

    // Smooth damping
    const lerpFactor = Math.min(1, delta * 3.5);
    currentPos.current.lerp(new THREE.Vector3(targetX, targetY, targetZ), lerpFactor);
    currentTarget.current.lerp(new THREE.Vector3(lookX, lookY, lookZ), lerpFactor);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentTarget.current);
  });

  return null;
};
