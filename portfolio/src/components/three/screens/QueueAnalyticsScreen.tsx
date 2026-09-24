import React, { useState, useEffect } from "react";
import { Eye, Activity, Users, ShieldAlert, Cpu, BarChart3 } from "lucide-react";

export const QueueAnalyticsScreen: React.FC = () => {
  const [peopleCount, setPeopleCount] = useState(5);
  const [queueLength, setQueueLength] = useState(3);
  const [fps, setFps] = useState(60);

  useEffect(() => {
    const interval = setInterval(() => {
      setPeopleCount(prev => Math.max(3, Math.min(9, prev + (Math.random() > 0.5 ? 1 : -1))));
      setQueueLength(prev => Math.max(2, Math.min(6, prev + (Math.random() > 0.6 ? 1 : -1))));
      setFps(Math.floor(Math.random() * 4) + 58);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full bg-[#06100c] text-[#f4f4f5] p-5 flex flex-col font-sans select-none overflow-hidden border border-emerald-500/25 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="font-mono text-xs font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              QUEUE VISION OPS // CCTV CAMERA_01
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              MODEL: YOLOV8N • TRACKER: BYTETRACK • FLASK REST: &lt;100MS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span className="text-zinc-400">FRAME_SKIP: 2X</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
            CUDA: {fps} FPS
          </span>
        </div>
      </div>

      {/* Main CCTV Feed + Telemetry */}
      <div className="flex-1 grid grid-cols-12 gap-4 pt-3 overflow-hidden">
        {/* Simulated CCTV Camera View with Bounding Boxes */}
        <div className="col-span-7 relative bg-black/80 rounded-lg border border-emerald-500/20 overflow-hidden flex items-center justify-center p-4">
          {/* Simulated CCTV Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0596690a_1px,transparent_1px),linear-gradient(to_bottom,#0596690a_1px,transparent_1px)] bg-[size:20px_20px]" />

          {/* Timecode overlay */}
          <div className="absolute top-2 left-2 text-[9px] font-mono text-emerald-400/80 bg-black/60 px-1.5 py-0.5 rounded">
            REC ● 2026-09-23 10:48:12 IST
          </div>

          {/* Simulated Person Detection Boxes */}
          <div className="absolute top-8 left-12 w-20 h-28 border border-emerald-400 bg-emerald-400/10 rounded flex flex-col justify-between p-1 transition-all duration-500">
            <span className="text-[8px] font-mono bg-emerald-500 text-black font-bold px-1 rounded-sm w-fit">
              #01 PERSON 98%
            </span>
            <span className="text-[7px] font-mono text-emerald-300">Wait: 1m 45s</span>
          </div>

          <div className="absolute bottom-8 right-16 w-22 h-30 border border-emerald-400 bg-emerald-400/10 rounded flex flex-col justify-between p-1 transition-all duration-700">
            <span className="text-[8px] font-mono bg-emerald-500 text-black font-bold px-1 rounded-sm w-fit">
              #02 PERSON 95%
            </span>
            <span className="text-[7px] font-mono text-emerald-300">Wait: 2m 10s</span>
          </div>

          <div className="absolute top-14 right-28 w-18 h-26 border border-cyan-400 bg-cyan-400/10 rounded flex flex-col justify-between p-1 transition-all duration-300">
            <span className="text-[8px] font-mono bg-cyan-400 text-black font-bold px-1 rounded-sm w-fit">
              #03 QUEUE_HEAD
            </span>
            <span className="text-[7px] font-mono text-cyan-200">Processing</span>
          </div>

          {/* Center Target Marker */}
          <div className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center pointer-events-none">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          </div>
        </div>

        {/* Real-Time Stats Column */}
        <div className="col-span-5 flex flex-col gap-2 font-mono">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex flex-col gap-0.5">
              <span className="text-[9px] text-zinc-400">TOTAL PEOPLE</span>
              <span className="text-xl font-bold text-white">{peopleCount}</span>
              <span className="text-[8px] text-emerald-400">Optimal capacity</span>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex flex-col gap-0.5">
              <span className="text-[9px] text-zinc-400">QUEUE DEPTH</span>
              <span className="text-xl font-bold text-emerald-400">{queueLength}</span>
              <span className="text-[8px] text-zinc-500">Service line A</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-black/60 border border-white/5 flex flex-col gap-1.5 text-xs">
            <span className="text-[9px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-400" />
              FLOW DYNAMICS
            </span>
            <div className="space-y-1 text-[11px] text-zinc-300">
              <div className="flex justify-between">
                <span>Entry Rate:</span>
                <span className="text-white font-bold">14 / min</span>
              </div>
              <div className="flex justify-between">
                <span>Exit Rate:</span>
                <span className="text-white font-bold">12 / min</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Wait Time:</span>
                <span className="text-emerald-400 font-bold">1m 58s</span>
              </div>
            </div>
          </div>

          <div className="p-2 rounded bg-white/5 border border-white/5 text-[9px] text-zinc-400">
            REST API: <code className="text-emerald-300">POST /api/analytics</code> (JSON payload with YOLO centroid bbox data)
          </div>
        </div>
      </div>
    </div>
  );
};
