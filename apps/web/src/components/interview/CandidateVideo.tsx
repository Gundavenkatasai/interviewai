
import React, { useEffect, useRef } from "react";
import { CameraOff, AlertCircle } from "lucide-react";

interface CandidateVideoProps {
  stream: MediaStream | null;
  cameraEnabled: boolean;
  permissionDenied: boolean;
  audioLevel: number; // 0-100
  userName?: string;
  onRequestPermission?: () => void;
}

export function CandidateVideo({
  stream,
  cameraEnabled,
  permissionDenied,
  audioLevel,
  userName = "You",
  onRequestPermission
}: CandidateVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, cameraEnabled]);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 shadow-lg flex items-center justify-center">
      {permissionDenied ? (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <h3 className="text-white font-medium mb-1">Camera/Mic Blocked</h3>
            <p className="text-slate-400 text-sm max-w-xs">
              Please allow access to your camera and microphone in your browser settings to continue the interview.
            </p>
          </div>
          {onRequestPermission && (
            <button
              onClick={onRequestPermission}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      ) : (
        <>
          {stream && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform scale-x-[-1] ${cameraEnabled ? "block" : "hidden"}`}
            />
          )}
          {(!cameraEnabled || !stream) && (
            <div className="flex flex-col items-center justify-center text-slate-500">
              <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-4 border border-slate-700">
                <span className="text-3xl font-medium text-slate-300">{initials}</span>
              </div>
              <CameraOff className="w-6 h-6 mb-2 text-slate-400" />
              <span className="text-sm font-medium text-slate-400">Camera Off</span>
            </div>
          )}
        </>
      )}

      {/* Overlays */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-between pointer-events-none">
        {/* Name Tag */}
        <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-sm font-medium flex items-center shadow-sm">
          {userName}
        </div>

        {/* Audio Level Indicator */}
        <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm">
          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-green-500 transition-all duration-75"
              style={{ width: `${audioLevel}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
