"use client";

import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Shield,
  Mic,
  Code2,
  FileText,
  Brain,
  History,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Layers
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center pt-8 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Hero Header */}
      <div className="max-w-4xl text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 mb-6 backdrop-blur-sm animate-pulse_slow">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Next-Generation AI Mock Interview Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Master Your Next Tech Interview with{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
            Real-Time AI Coaching
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Conduct realistic personal mock interviews with your friend, mentor, or directly against our AI coach.
          Features live transcription, deep 8-dimension answer evaluation, dynamic follow-ups, and in-browser coding.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-14">
          <Link
            href="/setup"
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Start Interview</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/history"
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-slate-300 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 flex items-center justify-center gap-2 transition-all"
          >
            <History className="w-5 h-5 text-indigo-400" />
            <span>Interview History</span>
          </Link>
        </div>

        {/* Trust & Privacy Pill */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 border border-slate-800/60 bg-slate-900/40 px-5 py-2.5 rounded-full backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>100% Selective Input (No Screen Scraping)</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Powered by Groq Llama 3 & Whisper</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-purple-400" />
            <span>Live Coding Sandbox</span>
          </div>
        </div>
      </div>

      {/* Interactive Mock Dashboard Preview */}
      <div className="w-full max-w-6xl mt-16 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-2 sm:p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/60 mb-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 font-mono text-slate-500">interviewai.dashboard / live-session</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-400 font-medium">Session Active</span>
          </div>
        </div>

        {/* 3-Panel Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left Panel */}
          <div className="md:col-span-3 rounded-xl bg-slate-950/80 border border-slate-800/60 p-4 flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Target Profile</span>
              <h3 className="text-base font-bold text-white mt-1">Full Stack Developer</h3>
              <p className="text-xs text-slate-400">Stripe • Mid-level • 30 mins</p>
              
              <div className="mt-4 pt-4 border-t border-slate-900">
                <span className="text-xs text-slate-500">Tech Stack</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {["React", "Node.js", "PostgreSQL", "Docker"].map((tech) => (
                    <span key={tech} className="px-2 py-0.5 rounded text-[11px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-900 text-xs text-slate-400 flex justify-between items-center">
              <span>Progress: 3 / 6</span>
              <span className="font-mono text-indigo-400">14:32 remaining</span>
            </div>
          </div>

          {/* Center Panel */}
          <div className="md:col-span-5 rounded-xl bg-slate-950/80 border border-slate-800/60 p-4 flex flex-col justify-between min-h-[220px]">
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">
                  Q
                </div>
                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  "Explain the trade-offs between SQL and NoSQL databases when scaling high-concurrency applications."
                </p>
              </div>

              <div className="flex items-start gap-2.5 pl-4 border-l-2 border-emerald-500/40">
                <div className="w-6 h-6 rounded bg-emerald-600/30 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                  A
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "SQL ensures ACID guarantees and relational integrity with foreign keys, whereas NoSQL scales horizontally with document models like MongoDB..."
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-xs">
              <div className="flex items-center gap-2 text-emerald-400">
                <Mic className="w-3.5 h-3.5" />
                <span className="text-[11px]">Transcribing live...</span>
              </div>
              <span className="text-[11px] text-slate-500">Groq Whisper Large v3</span>
            </div>
          </div>

          {/* Right Panel */}
          <div className="md:col-span-4 rounded-xl bg-slate-950/80 border border-slate-800/60 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">AI Coach Evaluation</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  8.2 / 10
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800/40">
                  <span className="text-slate-400 block text-[11px] font-semibold text-emerald-400">Strong Points:</span>
                  <p className="text-slate-300 text-[11px] mt-0.5">Accurate ACID explanation and horizontal partitioning awareness.</p>
                </div>

                <div className="p-2 rounded bg-slate-900/60 border border-slate-800/40">
                  <span className="text-slate-400 block text-[11px] font-semibold text-amber-400">Missing Concepts:</span>
                  <p className="text-slate-300 text-[11px] mt-0.5">Mention CAP theorem trade-offs and eventual consistency lag.</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-900 text-[11px] text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Follow-up: "How do you handle eventual consistency in microservices?"</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Breakdown Grid */}
      <div className="max-w-6xl w-full mt-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Engineered for Technical Excellence</h2>
          <p className="text-sm sm:text-base text-slate-400 mt-2">Everything you need to level up your interview performance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">8-Dimension AI Evaluation</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Every answer is graded on correctness, technical depth, communication, completeness, relevance, confidence, examples, and problem-solving.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Live Coding Sandbox</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Solve algorithmic challenges in JavaScript, Python, Java, or C++ directly inside Monaco Editor with automated test cases and AI time/space analysis.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Resume & Job Tailoring</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Upload your PDF/DOCX resume and paste target job descriptions. The AI generates surgical questions probing your specific projects and stack.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
