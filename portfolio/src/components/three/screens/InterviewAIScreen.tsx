import React, { useState, useEffect } from "react";
import { Mic, Cpu, CheckCircle2, Terminal, Play, BarChart2 } from "lucide-react";

export const InterviewAIScreen: React.FC = () => {
  const [waveformBars, setWaveformBars] = useState<number[]>([40, 65, 85, 45, 95, 70, 50, 80, 60, 90, 75, 55]);
  const [activeTab, setActiveTab] = useState<"transcript" | "code" | "rubric">("transcript");

  useEffect(() => {
    const interval = setInterval(() => {
      setWaveformBars(prev => prev.map(() => Math.floor(Math.random() * 65) + 30));
    }, 180);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full bg-[#0a0c10] text-[#e2e8f0] p-5 flex flex-col font-sans select-none overflow-hidden border border-sky-500/20 rounded-xl">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <div className="flex flex-col">
            <span className="font-mono text-xs font-bold tracking-wider text-sky-400">
              INTERVIEWAI // LIVE SIMULATION
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              SESSION: SYS_ARCH_L4 • ENGINE: GROQ_WHISPER
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("transcript")}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all ${
              activeTab === "transcript" ? "bg-sky-500/20 text-sky-400 border border-sky-500/40" : "text-zinc-500"
            }`}
          >
            TRANSCRIPT
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all ${
              activeTab === "code" ? "bg-sky-500/20 text-sky-400 border border-sky-500/40" : "text-zinc-500"
            }`}
          >
            MONACO SANDBOX
          </button>
          <button
            onClick={() => setActiveTab("rubric")}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all ${
              activeTab === "rubric" ? "bg-sky-500/20 text-sky-400 border border-sky-500/40" : "text-zinc-500"
            }`}
          >
            8-AXIS RUBRIC
          </button>
        </div>
      </div>

      {/* Main interactive viewport */}
      <div className="flex-1 grid grid-cols-12 gap-4 pt-3 overflow-hidden">
        {/* Left Column: AI Interviewer & Voice Feed */}
        <div className="col-span-5 flex flex-col gap-3 border-r border-white/5 pr-3">
          {/* AI Persona Box */}
          <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-500/20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-sky-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                AI INTERVIEWER (Groq OSS-120B)
              </span>
              <span className="text-[9px] font-mono bg-sky-500/10 text-sky-300 px-1.5 py-0.5 rounded">
                REAL-TIME
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              "Could you walk me through how you prevent race conditions and synchronize order state across 3 concurrent dashboards in your WebSocket architecture?"
            </p>
          </div>

          {/* Voice Waveform Visualizer */}
          <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Mic className="w-3 h-3" />
                USER SPEECH INPUT (Sub-400ms)
              </span>
              <span>16-bit 48kHz</span>
            </div>
            <div className="h-10 flex items-center justify-center gap-1.5 px-2">
              {waveformBars.map((height, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-sky-500 to-cyan-300 rounded-full transition-all duration-150"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>

          {/* Live speech transcription stream */}
          <div className="flex-1 p-3 rounded-lg bg-white/[0.02] border border-white/5 flex flex-col gap-1 overflow-hidden">
            <span className="text-[9px] font-mono text-zinc-500 uppercase">
              // Live Whisper Chunk Stream
            </span>
            <p className="text-[11px] text-zinc-300 font-mono italic leading-snug">
              "...we decouple the order state with atomic MongoDB transactions and broadcast mutation payloads over Socket.IO rooms partitioned by order IDs..."
            </p>
          </div>
        </div>

        {/* Right Column: Code Editor or Rubric Analysis */}
        <div className="col-span-7 flex flex-col gap-2 overflow-hidden">
          {activeTab === "code" ? (
            <div className="flex-1 bg-black/60 rounded-lg p-3 border border-white/10 font-mono text-xs flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] text-zinc-400">
                <span className="text-sky-300">socket_broker.py (FastAPI Sandbox)</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Play className="w-2.5 h-2.5" /> Piston: Verified 0.04s
                </span>
              </div>
              <pre className="text-[11px] text-zinc-300 leading-5 pt-2 overflow-x-auto flex-1">
{`@router.websocket("/ws/orders/{order_id}")
async def order_stream(ws: WebSocket, order_id: str):
    await manager.connect(ws, order_id)
    try:
        while True:
            payload = await ws.receive_json()
            # Atomically verify status transition
            await state_machine.transition(order_id, payload)
            await manager.broadcast_room(order_id, payload)
    except WebSocketDisconnect:
        manager.disconnect(ws, order_id)`}
              </pre>
            </div>
          ) : activeTab === "rubric" ? (
            <div className="flex-1 bg-black/60 rounded-lg p-3 border border-white/10 flex flex-col gap-2 overflow-y-auto">
              <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider">
                Real-Time 8-Axis Rubric Telemetry
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { name: "Technical Correctness", score: "9.4 / 10", color: "bg-emerald-500" },
                  { name: "System Architecture", score: "9.6 / 10", color: "bg-sky-500" },
                  { name: "Concurrency & Race Cond.", score: "9.2 / 10", color: "bg-cyan-500" },
                  { name: "Communication Clarity", score: "9.0 / 10", color: "bg-indigo-500" },
                  { name: "Algorithmic Depth", score: "8.8 / 10", color: "bg-violet-500" },
                  { name: "Error & Edge Cases", score: "9.1 / 10", color: "bg-teal-500" }
                ].map((item, idx) => (
                  <div key={idx} className="p-2 rounded bg-white/5 border border-white/5 flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-400">{item.name}</span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-white">{item.score}</span>
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-black/60 rounded-lg p-3 border border-white/10 flex flex-col gap-2 font-mono text-xs">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-white/10 pb-2">
                <span>CONVERSATION STREAM</span>
                <span className="text-emerald-400">STATUS: ACTIVE</span>
              </div>
              <div className="space-y-2 text-[11px] overflow-y-auto">
                <div className="p-2 rounded bg-sky-950/30 border border-sky-500/20 text-sky-200">
                  <span className="text-[9px] uppercase font-bold text-sky-400 block mb-0.5">AI Interviewer:</span>
                  "Great explanation on room partitioning. How would you handle reconnection if a client drops WiFi for 5 seconds?"
                </div>
                <div className="p-2 rounded bg-zinc-900 border border-white/10 text-zinc-300">
                  <span className="text-[9px] uppercase font-bold text-orange-400 block mb-0.5">Candidate (Sai):</span>
                  "We utilize Socket.IO ack callbacks with a sequence ID cursor in Redis cache to replay missed payloads upon reconnect."
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
