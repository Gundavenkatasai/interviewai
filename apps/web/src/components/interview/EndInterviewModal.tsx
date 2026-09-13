
import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface EndInterviewModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  questionsAnswered: number;
  totalQuestions: number;
}

export function EndInterviewModal({
  isOpen,
  onConfirm,
  onCancel,
  questionsAnswered,
  totalQuestions,
}: EndInterviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop blur overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          
          <h2 className="text-xl font-semibold text-white mb-2">
            Are you sure you want to end this interview?
          </h2>
          
          <p className="text-slate-400 mb-6">
            You've answered <strong className="text-white">{questionsAnswered}</strong> out of <strong className="text-white">{totalQuestions}</strong> questions. 
            If you end now, the interview will be submitted as-is and you cannot resume later.
          </p>

          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Continue Interview
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              End Interview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
