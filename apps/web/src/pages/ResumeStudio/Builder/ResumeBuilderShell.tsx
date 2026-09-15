import React, { useEffect } from "react";
import { TopToolbar } from "./Toolbar/TopToolbar";
import { LeftSidebar } from "./LeftSidebar/LeftSidebar";
import { LivePreview } from "./Canvas/LivePreview";
import { RightSidebar } from "./RightSidebar/RightSidebar";
import { useResumeStore } from "../store/useResumeStore";

interface Props {
  resumeId: string;
}

export const ResumeBuilderShell: React.FC<Props> = ({ resumeId }) => {
  const { resume } = useResumeStore();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-300 font-sans selection:bg-indigo-500/30">
      {/* Top Toolbar */}
      <div className="h-14 flex-shrink-0 z-20 border-b border-zinc-800 bg-zinc-950">
        <TopToolbar />
      </div>
      
      {/* 5-Pane Workspace equivalent (Nav -> Editor -> Canvas <- Editor <- Nav) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebars (Nav + Editor) */}
        <div className="flex flex-shrink-0 h-full border-r border-zinc-800">
          <LeftSidebar />
        </div>

        {/* Center - Live Canvas */}
        <main className="flex-1 overflow-auto bg-zinc-900 flex items-center justify-center p-8 relative">
          <LivePreview />
        </main>

        {/* Right Sidebars (Editor + Nav) */}
        <div className="flex flex-shrink-0 h-full border-l border-zinc-800">
          <RightSidebar />
        </div>

      </div>
    </div>
  );
};
