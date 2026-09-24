import React from "react";
import { StudioLighting } from "./StudioLighting";
import { StudioMonitor } from "./StudioMonitor";
import { StudioLaptop } from "./StudioLaptop";
import { FloatingPanels } from "./FloatingPanels";
import { CameraRig } from "./CameraRig";

interface VirtualStudioSceneProps {
  scrollProgress: number;
  mouse: { normalizedX: number; normalizedY: number };
  activeScreen?: "hero" | "interviewai" | "pizza_craft" | "lpulive" | "queue_analytics";
}

export const VirtualStudioScene: React.FC<VirtualStudioSceneProps> = ({
  scrollProgress,
  mouse,
  activeScreen = "hero"
}) => {
  return (
    <>
      <CameraRig scrollProgress={scrollProgress} mouse={mouse} />
      <StudioLighting />
      <StudioMonitor activeScreen={activeScreen} />
      <StudioLaptop position={[1.4, -1.2, 1.8]} rotation={[-0.15, -0.4, 0]} />
      <FloatingPanels />
    </>
  );
};
