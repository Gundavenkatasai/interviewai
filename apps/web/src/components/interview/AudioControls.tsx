"use client";

import {
  Mic,
  MicOff,
  Square,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Radio
} from "lucide-react";
import { PermissionStatus } from "@/hooks/useAudio";

interface AudioControlsProps {
  permissionStatus: PermissionStatus;
  isRecording: boolean;
  isPaused: boolean;
  isMuted: boolean;
  aiStatus: string;
  audioLevel: number;
  errorMessage: string | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onToggleMute: () => void;
}

export function AudioControls({
  permissionStatus,
  isRecording,
  isPaused,
  isMuted,
  aiStatus,
  audioLevel,
  errorMessage,
  onStart,
  onPause,
  onResume,
  onStop,
  onToggleMute,
}: AudioControlsProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Visible Recording Indicator & Permission */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            {isRecording ? (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            ) : (
              <span className="h-3 w-3 rounded-full bg-slate-600" />
            )}

            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              {isRecording ? (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  Microphone active
                </span>
              ) : (
                <span className="text-slate-400">Microphone idle</span>
              )}
            </span>
          </div>

          {/* AI Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                aiStatus === "listening"
                  ? "bg-emerald-400 animate-pulse"
                  : aiStatus === "analyzing" || aiStatus === "transcribing"
                  ? "bg-amber-400 animate-spin"
                  : "bg-indigo-400"
              }`}
            />
            <span className="capitalize text-slate-300 font-medium">
              {aiStatus === "listening"
                ? "Listening..."
                : aiStatus === "transcribing"
                ? "Transcribing..."
                : aiStatus === "analyzing"
                ? "Analyzing..."
                : "Ready"}
            </span>
          </div>
        </div>

        {/* Middle: Audio Level Visualizer */}
        {isRecording && !isPaused && (
          <div className="flex items-center gap-1 h-5 px-2 bg-slate-900/60 rounded-lg border border-slate-800/60">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => {
              const active = audioLevel > bar * 11;
              return (
                <span
                  key={bar}
                  className={`w-1 rounded-full transition-all duration-75 ${
                    active ? "bg-emerald-400" : "bg-slate-700/40"
                  }`}
                  style={{
                    height: active ? `${Math.max(4, (audioLevel / 100) * 18)}px` : "4px",
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Right: Primary Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Mute Button */}
          {isRecording && (
            <button suppressHydrationWarning
              type="button"
              onClick={onToggleMute}
              className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                isMuted
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
              }`}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}

          {/* Pause / Resume */}
          {isRecording && (
            <button suppressHydrationWarning
              type="button"
              onClick={isPaused ? onResume : onPause}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title={isPaused ? "Resume Recording" : "Pause Recording"}
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
            </button>
          )}

          {/* Start / Stop Main Action */}
          {!isRecording ? (
            <button suppressHydrationWarning
              type="button"
              onClick={onStart}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-colors"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Start Speaking</span>
            </button>
          ) : (
            <button suppressHydrationWarning
              type="button"
              onClick={onStop}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Done Answering</span>
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="mt-2 text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-lg">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
