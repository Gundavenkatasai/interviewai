
import React, { useState } from "react";
import { Camera, Mic, Settings, AlertCircle, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { useMediaDevices } from "@/hooks/useMediaDevices";

interface MediaSetupProps {
  onPermissionsGranted: (videoStream?: MediaStream, audioStream?: MediaStream) => void;
  onCancel: () => void;
  sessionInfo?: { role?: string; difficulty?: string; interviewType?: string };
  mediaDevices?: ReturnType<typeof useMediaDevices>;
}

export function MediaSetup({ onPermissionsGranted, onCancel, sessionInfo, mediaDevices: externalMediaDevices }: MediaSetupProps) {
  const fallbackMediaDevices = useMediaDevices();
  const mediaDevices = externalMediaDevices || fallbackMediaDevices;

  const {
    requestPermissions,
    permissionState,
    videoStream,
    audioStream,
    availableCameras,
    availableMics,
    selectCamera,
    selectMic,
    audioLevel,
    videoRef
  } = mediaDevices;

  const [requesting, setRequesting] = useState(false);

  const handleRequestPermissions = async () => {
    setRequesting(true);
    await requestPermissions();
    setRequesting(false);
  };

  const isGranted = permissionState === 'granted';
  const isDenied = permissionState === 'denied';
  // Allow proceeding: either fully granted, OR denied but user wants to continue without camera
  const canProceed = isGranted || isDenied;

  const handleProceed = () => {
    // Unlock Speech Synthesis context safely on user gesture without empty utterances
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e) {}
    }
    
    onPermissionsGranted(videoStream ?? undefined, audioStream ?? undefined);
  };

  // ── INITIAL STATE: Ask user to grant permissions ──
  if (permissionState === 'prompt') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-10 text-center">
            <div className="flex justify-center gap-5 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Camera className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Mic className="w-8 h-8 text-emerald-400" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">Allow Camera & Microphone</h2>
            <p className="text-slate-400 leading-relaxed mb-2">
              InterviewAI needs access to your camera and microphone to conduct the interview.
            </p>
            <p className="text-slate-500 text-sm mb-8">
              Click <span className="text-white font-medium">"Allow"</span> when your browser asks for permission.
            </p>

            {sessionInfo && (
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {sessionInfo.role && (
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-sm font-medium">
                    {sessionInfo.role}
                  </span>
                )}
                {sessionInfo.difficulty && (
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-sm font-medium capitalize">
                    {sessionInfo.difficulty}
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={handleRequestPermissions}
                disabled={requesting}
                className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-2xl font-semibold text-lg transition-all shadow-lg shadow-indigo-900/40"
              >
                {requesting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Requesting access...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Enable Camera & Microphone
                  </>
                )}
              </button>

              <button
                onClick={onCancel}
                className="w-full py-3 text-slate-500 hover:text-slate-300 font-medium transition-colors text-sm"
              >
                Cancel
              </button>
            </div>

            <p className="text-slate-600 text-xs mt-6">
              Your video is not recorded or stored. Audio transcripts are used only for evaluation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── REQUESTING STATE ──
  if (permissionState === 'requesting') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Requesting Access...</h2>
          <p className="text-slate-400">Please allow camera and microphone access in your browser popup.</p>
        </div>
      </div>
    );
  }

  // ── GRANTED or DENIED: Show preview / device selection ──
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="p-8 border-b border-slate-800 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Equipment Setup</h2>
          <p className="text-slate-400">Check your camera and microphone before we begin.</p>

          {sessionInfo && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {sessionInfo.role && (
                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-sm font-medium">
                  {sessionInfo.role}
                </span>
              )}
              {sessionInfo.difficulty && (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-sm font-medium capitalize">
                  {sessionInfo.difficulty}
                </span>
              )}
              {sessionInfo.interviewType && (
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-sm font-medium">
                  {sessionInfo.interviewType}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Denied Banner */}
        {isDenied && (
          <div className="mx-8 mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-amber-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-300 text-sm">Camera/Microphone access was blocked</p>
              <p className="text-xs mt-1 text-amber-400/80">
                To fix: click the 🔒 lock icon in your browser address bar → allow Camera & Microphone → refresh.
              </p>
            </div>
            <button
              onClick={handleRequestPermissions}
              className="flex-shrink-0 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Device Cards */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Camera Card */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col">
              <div className="flex items-center space-x-3 mb-4 text-white">
                <Camera className="w-6 h-6 text-indigo-400" />
                <h3 className="text-lg font-medium">Camera</h3>
                {videoStream && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />}
                {isDenied && !videoStream && <AlertCircle className="w-5 h-5 text-amber-500 ml-auto" />}
              </div>

              <div className="flex-1 bg-slate-900 rounded-xl overflow-hidden relative min-h-[200px] flex items-center justify-center border border-slate-800/50">
                {videoStream ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                ) : (
                  <div className="text-slate-500 flex flex-col items-center">
                    <Camera className="w-12 h-12 mb-3 opacity-20" />
                    <span className="text-sm">{isDenied ? "Camera blocked" : "No video feed"}</span>
                  </div>
                )}
              </div>

              {availableCameras.length > 0 && (
                <div className="mt-4">
                  <label className="text-xs text-slate-400 font-medium mb-1.5 block">Select Camera</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                    onChange={(e) => selectCamera(e.target.value)}
                  >
                    {availableCameras.map(cam => (
                      <option key={cam.deviceId} value={cam.deviceId}>
                        {cam.label || `Camera ${availableCameras.indexOf(cam) + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Microphone Card */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col">
              <div className="flex items-center space-x-3 mb-4 text-white">
                <Mic className="w-6 h-6 text-indigo-400" />
                <h3 className="text-lg font-medium">Microphone</h3>
                {audioStream && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />}
                {isDenied && !audioStream && <AlertCircle className="w-5 h-5 text-amber-500 ml-auto" />}
              </div>

              <div className="flex-1 bg-slate-900 rounded-xl p-6 border border-slate-800/50 flex flex-col justify-center space-y-8">
                {audioStream ? (
                  <>
                    <div className="text-center text-slate-300 text-sm">
                      Speak to test your microphone
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-75 rounded-full"
                          style={{ width: `${Math.max(2, audioLevel)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Quiet</span>
                        <span>Loud</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-500 flex flex-col items-center">
                    <Mic className="w-12 h-12 mb-3 opacity-20" />
                    <span className="text-sm">{isDenied ? "Microphone blocked" : "No audio feed"}</span>
                  </div>
                )}
              </div>

              {availableMics.length > 0 && (
                <div className="mt-4">
                  <label className="text-xs text-slate-400 font-medium mb-1.5 block">Select Microphone</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                    onChange={(e) => selectMic(e.target.value)}
                  >
                    {availableMics.map(mic => (
                      <option key={mic.deviceId} value={mic.deviceId}>
                        {mic.label || `Microphone ${availableMics.indexOf(mic) + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 bg-slate-800/30 rounded-xl p-4 flex items-start space-x-3 text-sm text-slate-400">
            <Settings className="w-5 h-5 flex-shrink-0 mt-0.5 text-slate-500" />
            <p>
              Camera and microphone are used only during the interview. Audio transcripts are saved for evaluation. Raw video is not recorded or stored.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <button
            onClick={onCancel}
            className="px-6 py-3 text-slate-400 hover:text-white font-medium transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-4">
            {isDenied && (
              <span className="text-amber-400/70 text-xs max-w-[200px] text-right">
                You can proceed without camera — interview will be audio-only
              </span>
            )}
            <button
              onClick={handleProceed}
              disabled={!canProceed}
              className={`px-8 py-3 rounded-xl font-semibold shadow-lg transition-all ${
                canProceed
                  ? isDenied
                    ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 hover:-translate-y-0.5"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              {isDenied ? "Continue Without Camera" : "Enter Interview Room"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
