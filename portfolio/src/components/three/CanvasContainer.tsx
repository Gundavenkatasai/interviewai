import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { VirtualStudioScene } from "./VirtualStudioScene";

interface CanvasContainerProps {
  scrollProgress: number;
  mouse: { normalizedX: number; normalizedY: number };
  activeScreen?: "hero" | "interviewai" | "pizza_craft" | "lpulive" | "queue_analytics";
}

export const CanvasContainer: React.FC<CanvasContainerProps> = ({
  scrollProgress,
  mouse,
  activeScreen = "hero"
}) => {
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    return (
      <div className="fixed inset-0 z-0 bg-[#09090b] flex items-center justify-center pointer-events-none">
        <div className="w-full h-full bg-gradient-to-b from-[#121216] via-[#09090b] to-[#09090b] opacity-80" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <Canvas
        camera={{ position: [0, 0.4, 4.6], fov: 45, near: 0.1, far: 50 }}
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          depth: true
        }}
        shadows
      >
        <Suspense fallback={null}>
          <VirtualStudioScene
            scrollProgress={scrollProgress}
            mouse={mouse}
            activeScreen={activeScreen}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
