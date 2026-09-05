"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Mic,
  FileText,
  EyeOff,
  Server
} from "lucide-react";
import { ApiClient } from "@/lib/api";

export default function PrivacyPage() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleDeleteAllData = async () => {
    if (
      !confirm(
        "WARNING: This will permanently delete ALL your interview sessions, recorded transcripts, scores, uploaded resumes, and job descriptions. This action CANNOT be undone.\n\nAre you sure?"
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setStatusMessage(null);

    try {
      const res = await ApiClient.deleteAllUserData();
      setStatusMessage(res.message || "All personal interview data permanently wiped.");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      alert("Error deleting data: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <span>Privacy & Data Sovereignty</span>
          <span className="text-xs uppercase font-semibold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            Selective Input
          </span>
        </h1>
        <p className="text-sm text-slate-400 mt-1.5">
          InterviewAI is strictly an interview-practice and learning tool. We hold zero-tolerance for surveillance bypasses or non-consensual capture.
        </p>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Core Privacy Guarantees */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Mic className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Explicit Microphone Consent</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Audio is requested exclusively via standard <code className="text-indigo-300">navigator.mediaDevices.getUserMedia</code>.
            Microphone indicators are continuously and prominently displayed on your screen whenever active.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">No Desktop / Window Capture</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            We never invoke <code className="text-indigo-300">getDisplayMedia()</code> to observe other applications, nor do we attempt DOM injection into Google Meet, Zoom, or Microsoft Teams.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">No Screen-Share Evasion</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The platform contains zero hidden overlays, anti-monitoring mechanisms, or techniques designed to conceal the application from an interviewer or monitoring software.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Data Retention Policy</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your transcripts and evaluations are stored securely in your database for your personal progress tracking. You maintain total control and can delete any interview or wipe all data at any moment.
          </p>
        </div>
      </div>

      {/* Wipe All Data Action */}
      <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/20 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-bold text-white">Permanent Data Purge (Right to be Forgotten)</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Delete all interview sessions, transcripts, audio references, uploaded resumes, and job descriptions associated with your account from the database.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button suppressHydrationWarning
            type="button"
            onClick={handleDeleteAllData}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 shadow-md shadow-rose-600/20 flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? "Purging Records..." : "Delete All My Data"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
