"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Award,
  Download,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Brain,
  MessageSquare,
  Cpu
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

import { ApiClient } from "@/lib/api";
import { InterviewSession, InterviewScore } from "@/types";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const data = await ApiClient.getInterview(sessionId);
        setSession(data);
      } catch (e: any) {
        alert("Error loading report: " + e.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReport();
  }, [sessionId]);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#030712",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`InterviewAI_Report_${session?.role || "Candidate"}.pdf`);
    } catch (err: any) {
      alert("PDF Export failed: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Generating AI diagnostic report...</p>
      </div>
    );
  }

  if (!session || !session.score) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Report Not Available</h2>
        <p className="text-sm text-slate-400">The session has not been finalized with a score yet.</p>
        <Link
          href={`/interview/${sessionId}`}
          className="inline-block px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Return to Session
        </Link>
      </div>
    );
  }

  const score = session.score;

  const getVerdictBadge = (verdict: string) => {
    if (verdict === "Ready") {
      return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
    }
    if (verdict === "Needs Practice") {
      return "bg-amber-500/10 border-amber-500/30 text-amber-400";
    }
    return "bg-rose-500/10 border-rose-500/30 text-rose-400";
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/setup"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Practice Again</span>
          </Link>

          <button suppressHydrationWarning
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? "Exporting PDF..." : "Export as PDF"}</span>
          </button>
        </div>
      </div>

      {/* Printable Report Container */}
      <div ref={reportRef} className="space-y-8 p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800/80 shadow-2xl">
        {/* Report Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-wider font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                AI Assessment Diagnostic
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">{new Date(session.created_at).toLocaleDateString()}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Mock Interview Report: {session.role}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {session.company ? `Target Company: ${session.company} • ` : ""}
              Level: {session.experience_level} • Difficulty: {session.difficulty}
            </p>
          </div>

          <div className="text-right flex flex-col items-start md:items-end">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Final Recommendation
            </span>
            <span
              className={`mt-1 text-sm sm:text-base font-bold px-3 py-1 rounded-xl border ${getVerdictBadge(
                score.final_recommendation
              )}`}
            >
              {score.final_recommendation}
            </span>
          </div>
        </div>

        {/* Score Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center flex flex-col justify-center">
            <span className="text-xs text-slate-400 uppercase font-semibold">Overall Score</span>
            <span className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
              {score.overall_score}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">out of 10</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center flex flex-col justify-center">
            <span className="text-xs text-slate-400 uppercase font-semibold">Technical</span>
            <span className="text-2xl sm:text-3xl font-bold text-indigo-400 mt-1">
              {score.technical_score}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">out of 10</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center flex flex-col justify-center">
            <span className="text-xs text-slate-400 uppercase font-semibold">Communication</span>
            <span className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">
              {score.communication_score}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">out of 10</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center flex flex-col justify-center">
            <span className="text-xs text-slate-400 uppercase font-semibold">Problem Solving</span>
            <span className="text-2xl sm:text-3xl font-bold text-purple-400 mt-1">
              {score.problem_solving_score}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">out of 10</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center flex flex-col justify-center col-span-2 sm:col-span-1">
            <span className="text-xs text-slate-400 uppercase font-semibold">Confidence</span>
            <span className="text-2xl sm:text-3xl font-bold text-amber-400 mt-1">
              {score.confidence_score}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">out of 10</span>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center">
          <h3 className="text-sm font-bold text-white mb-4">Competency Radar</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="70%"
                data={[
                  { subject: "Technical", A: score.technical_score, fullMark: 10 },
                  { subject: "Communication", A: score.communication_score, fullMark: 10 },
                  { subject: "Problem Solving", A: score.problem_solving_score, fullMark: 10 },
                  { subject: "Confidence", A: score.confidence_score, fullMark: 10 },
                  { subject: "Overall", A: score.overall_score, fullMark: 10 },
                ]}
              >
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: "#64748b", fontSize: 10 }} />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strengths & Weaknesses 2-Column Split */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Key Demonstrated Strengths</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {score.strengths && score.strengths.length > 0 ? (
                score.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))
              ) : (
                <li>Solid foundational concepts articulated cleanly.</li>
              )}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Areas for Improvement & Blindspots</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {score.weaknesses && score.weaknesses.length > 0 ? (
                score.weaknesses.map((weak, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{weak}</span>
                  </li>
                ))
              ) : (
                <li>Consider diving deeper into production architectural trade-offs.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Questions Breakdown: Answered Well vs Poorly */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Questions Answered Strongly</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {score.questions_answered_well && score.questions_answered_well.length > 0 ? (
                score.questions_answered_well.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{q}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-500">None flagged above high bar.</li>
              )}
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Questions Needing Revision</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {score.questions_answered_poorly && score.questions_answered_poorly.length > 0 ? (
                score.questions_answered_poorly.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">!</span>
                    <span>{q}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-500">All questions answered satisfactorily.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Recommended Study Topics */}
        {score.recommended_study_topics && score.recommended_study_topics.length > 0 && (
          <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
            <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Recommended Study Topics & Roadmaps</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {score.recommended_study_topics.map((topic, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-200"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Question-by-Question Diagnostic */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white tracking-wide">
            Question-by-Question Deep Dive
          </h3>

          <div className="space-y-4">
            {session.questions?.map((q, idx) => {
              const ans = q.answers?.[0];
              const evalRes = ans?.evaluation;
              return (
                <div key={q.id} className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[11px] uppercase font-bold text-indigo-400">
                        Question #{idx + 1} • {q.category}
                      </span>
                      <h4 className="text-sm font-semibold text-white">"{q.question_text}"</h4>
                    </div>

                    {evalRes && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-950 border border-slate-700 text-emerald-400 shrink-0">
                        {evalRes.score} / 10
                      </span>
                    )}
                  </div>

                  {ans && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/60 text-xs text-slate-300 space-y-1">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                        Your Answer
                      </span>
                      <p className="whitespace-pre-line leading-relaxed">{ans.answer_text}</p>
                    </div>
                  )}

                  {evalRes?.recommended_answer && (
                    <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-indigo-200 space-y-1">
                      <span className="text-[10px] text-indigo-400 font-semibold uppercase block">
                        Recommended Model Response
                      </span>
                      <p className="whitespace-pre-line leading-relaxed">{evalRes.recommended_answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
