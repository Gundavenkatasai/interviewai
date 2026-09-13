
import React from "react";
import { Loader2 } from "lucide-react";

export type AIAvatarState = 'idle' | 'thinking' | 'speaking' | 'listening' | 'processing';

interface AIAvatarProps {
  state: AIAvatarState;
  name?: string;
}

export function AIAvatar({ state, name = "AI Interviewer" }: AIAvatarProps) {
  const getStatusText = () => {
    switch (state) {
      case 'idle': return "Ready";
      case 'thinking': return "Thinking...";
      case 'speaking': return "Speaking...";
      case 'listening': return "Listening...";
      case 'processing': return "Processing...";
      default: return "Ready";
    }
  };

  const getStatusColor = () => {
    switch (state) {
      case 'idle': return "bg-slate-400";
      case 'thinking': return "bg-amber-400";
      case 'speaking': return "bg-indigo-400";
      case 'listening': return "bg-green-400";
      case 'processing': return "bg-blue-400";
      default: return "bg-slate-400";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* Avatar Circle */}
      <div 
        className={`relative flex items-center justify-center w-[200px] h-[200px] rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 shadow-2xl transition-all duration-500 ${state === 'listening' ? 'ring-4 ring-green-400 ring-opacity-50' : ''}`}
      >
        {/* Pulsing effect for thinking/processing */}
        {(state === 'thinking' || state === 'processing') && (
          <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping" style={{ animationDuration: '2s' }} />
        )}
        
        {/* Abstract AI motif */}
        <div className="relative w-32 h-32">
          {/* Inner concentric circles */}
          <div className="absolute inset-0 m-auto w-24 h-24 rounded-full border-2 border-white/20" />
          <div className="absolute inset-0 m-auto w-16 h-16 rounded-full border-2 border-white/40" />
          <div className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-white/60" />
          
          {/* Rotating elements when processing or thinking */}
          {(state === 'thinking' || state === 'processing') && (
            <div className="absolute inset-0 animate-spin-slow">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white" />
            </div>
          )}
        </div>
      </div>

      {/* Speaking Waveform */}
      <div className="h-8 flex items-center justify-center space-x-1">
        {state === 'speaking' ? (
          <>
            <div className="w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ height: '16px', animationDelay: '0ms' }} />
            <div className="w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ height: '24px', animationDelay: '100ms' }} />
            <div className="w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ height: '32px', animationDelay: '200ms' }} />
            <div className="w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ height: '24px', animationDelay: '300ms' }} />
            <div className="w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ height: '16px', animationDelay: '400ms' }} />
          </>
        ) : (
          <div className="w-16 h-1 bg-slate-700 rounded-full" />
        )}
      </div>

      {/* Status Chip */}
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-medium text-white mb-2">{name}</h3>
        <div className="flex items-center space-x-2 bg-slate-800/80 rounded-full px-4 py-1.5 border border-slate-700">
          <span className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-sm font-medium text-slate-300">
            {getStatusText()}
          </span>
          {state === 'processing' && <Loader2 className="w-3 h-3 text-slate-400 animate-spin ml-1" />}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}} />
    </div>
  );
}
