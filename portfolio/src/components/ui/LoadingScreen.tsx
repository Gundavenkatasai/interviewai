import React, { useEffect, useState } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setFading(true);
          setTimeout(() => onComplete(), 600);
          return 100;
        }
        const increment = Math.floor(Math.random() * 14) + 8;
        return Math.min(prev + increment, 100);
      });
    }, 70);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#09090b] text-[#f4f4f5] transition-opacity duration-700 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6 max-w-sm w-full px-6">
        {/* Monogram */}
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-[#121216] border border-white/10 shadow-2xl">
          <span className="font-display font-black text-2xl text-white tracking-tighter">
            SAI
          </span>
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[#ea580c] to-sky-500 opacity-20 blur-sm animate-pulse-slow" />
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            INITIALIZING VIRTUAL STUDIO
          </span>
          <span className="font-mono text-[11px] text-zinc-600">
            3D WebGL • Real-Time Systems • Workstation
          </span>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-[#ea580c] via-orange-400 to-sky-400 transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-full font-mono text-[10px] text-zinc-500">
          <span>SYSTEM_READY</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
};
