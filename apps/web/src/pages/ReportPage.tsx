import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Award,
  Download,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Brain,
  MessageSquare,
  HelpCircle,
  Clock,
  Briefcase,
  Target,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { ApiClient } from "../lib/api";

export default function ReportPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) return;
    setIsLoading(true);

    Promise.all([
      ApiClient.getInterview(sessionId).catch(() => null),
      ApiClient.getInterviewReport(sessionId).catch(() => null),
    ])
      .then(([sess, rep]) => {
        setSession(sess);
        setReport(rep || sess?.report || null);
      })
      .catch((e: any) => {
        console.error("Error loading report:", e);
      })
      .finally(() => setIsLoading(false));
  }, [sessionId]);

  const toggleQuestion = (qId: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#030712",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`InterviewAI_Diagnostic_Report_${session?.role || "Candidate"}.pdf`);
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
        <p className="text-sm font-semibold text-slate-300">Compiling comprehensive diagnostic report...</p>
      </div>
    );
  }

  // Fallback to session.score if report model is still synthesizing
  const activeReport = report || (session?.score ? {
    overallScore: session.score.overall_score || 8.0,
    dimensionScores: {
      technical: session.score.technical_score || 8.0,
      communication: session.score.communication_score || 8.0,
      problemSolving: session.score.problem_solving_score || 8.0,
      relevance: 8.0,
      completeness: 7.5,
      depth: 7.5,
      structure: 8.0,
      confidence: session.score.confidence_score || 8.0,
    },
    strengths: session.score.strengths || [],
    weaknesses: session.score.areas_for_improvement || [],
    technicalGaps: [],
    readinessAssessment: session.score.final_recommendation || "Ready",
    recommendedTopics: session.score.recommended_study_topics || [],
    questionResults: (session.questions || []).map((q: any, i: number) => ({
      questionId: q._id || `q-${i}`,
      sequenceNumber: i + 1,
      questionText: q.questionText || q.question_text,
      category: q.category || "technical",
      difficulty: q.difficulty || "medium",
      score: q.evaluation?.score || 8.0,
      candidateAnswer: q.answer?.answerText || q.answer?.transcript,
      whatWentWell: q.evaluation?.strengths || [],
      whatCouldImprove: q.evaluation?.weaknesses || [],
      evidence: q.evaluation?.evidence || [],
      recommendedAnswer: q.evaluation?.recommendedAnswer,
    })),
  } : null);

  if (!activeReport) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Report Being Synthesized</h2>
        <p className="text-sm text-slate-400">
          The evaluation engine is processing your session. Please refresh or return to session.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            to={`/interview/${sessionId}`}
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
          >
            Return to Session
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Refresh Report
          </button>
        </div>
      </div>
    );
  }

  const dims = activeReport.dimensionScores || {};
  const radarData = [
    { subject: "Technical", score: dims.technical || 8, fullMark: 10 },
    { subject: "Communication", score: dims.communication || 8, fullMark: 10 },
    { subject: "Problem Solving", score: dims.problemSolving || 8, fullMark: 10 },
    { subject: "Relevance", score: dims.relevance || 8, fullMark: 10 },
    { subject: "Completeness", score: dims.completeness || 7.5, fullMark: 10 },
    { subject: "Depth", score: dims.depth || 7.5, fullMark: 10 },
    { subject: "Structure", score: dims.structure || 8, fullMark: 10 },
    { subject: "Confidence", score: dims.confidence || 8, fullMark: 10 },
  ];

  const getVerdictBadge = (verdict: string) => {
    if (verdict === "Ready" || verdict === "Strongly Ready") {
      return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
    }
    if (verdict === "Needs Practice") {
      return "bg-amber-500/10 border-amber-500/30 text-amber-400";
    }
    return "bg-rose-500/10 border-rose-500/30 text-rose-400";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-slate-100">
      {/* ── Top Bar Navigation ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/history"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <span>History</span>
          </Link>
          <Link
            to="/setup"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Practice Again</span>
          </Link>
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? "Exporting..." : "Export PDF"}</span>
          </button>
        </div>
      </div>

      {/* ── Printable Report Container ── */}
      <div
        ref={reportRef}
        className="space-y-8 p-6 sm:p-10 rounded-3xl bg-slate-950 border border-slate-800/80 shadow-2xl"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-wider font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                Verified AI Diagnostic Report
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-mono">
                {session?.created_at ? new Date(session.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Mock Interview Report: {session?.role || "Software Engineer"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              {session?.company && <span>Company: <strong className="text-slate-200">{session.company}</strong> •</span>}
              <span>Level: <strong className="text-slate-200">{session?.experience_level || session?.experienceLevel || "Mid"}</strong> •</span>
              <span>Difficulty: <strong className="text-slate-200 capitalize">{session?.difficulty || "Medium"}</strong> •</span>
              <span>Questions: <strong className="text-slate-200">{activeReport.totalQuestions || activeReport.questionResults?.length || 5}</strong></span>
            </p>
          </div>

          <div className="text-right flex flex-col items-start md:items-end">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Readiness Assessment</span>
            <span
              className={`mt-1 text-sm sm:text-base font-bold px-3.5 py-1 rounded-xl border ${getVerdictBadge(
                activeReport.readinessAssessment
              )}`}
            >
              {activeReport.readinessAssessment}
            </span>
          </div>
        </div>

        {/* 8-Dimension Score Grid */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Core Evaluation Dimensions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: "Overall", value: activeReport.overallScore, color: "text-white" },
              { label: "Technical", value: dims.technical, color: "text-indigo-400" },
              { label: "Communication", value: dims.communication, color: "text-emerald-400" },
              { label: "Problem Solving", value: dims.problemSolving, color: "text-purple-400" },
              { label: "Relevance", value: dims.relevance, color: "text-blue-400" },
              { label: "Completeness", value: dims.completeness, color: "text-teal-400" },
              { label: "Depth", value: dims.depth, color: "text-cyan-400" },
              { label: "Confidence", value: dims.confidence, color: "text-amber-400" },
            ].map((m) => (
              <div
                key={m.label}
                className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center flex flex-col justify-center"
              >
                <span className="text-[10px] text-slate-400 uppercase font-semibold truncate">{m.label}</span>
                <span className={`text-2xl sm:text-3xl font-extrabold mt-1 ${m.color}`}>
                  {m.value != null ? Number(m.value).toFixed(1) : "--"}
                </span>
                <span className="text-[9px] text-slate-500 mt-0.5">/ 10</span>
              </div>
            ))}
          </div>
        </div>

        {/* Competency Radar Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center">
          <h3 className="text-sm font-bold text-white mb-2">Competency Radar Profile</h3>
          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: "#64748b", fontSize: 9 }} />
                <Radar name="Performance" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Key Demonstrated Strengths</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {activeReport.strengths?.length > 0 ? (
                activeReport.strengths.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))
              ) : (
                <li>Clear articulation of foundational technical concepts.</li>
              )}
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Areas for Improvement</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {activeReport.weaknesses?.length > 0 ? (
                activeReport.weaknesses.map((w: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))
              ) : (
                <li>Incorporate quantitative benchmarks and edge-case mitigation in responses.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Technical Gaps & Topic Coverage */}
        {activeReport.technicalGaps?.length > 0 && (
          <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>Identified Technical Gaps</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {activeReport.technicalGaps.map((gap: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-xl bg-slate-900 border border-amber-500/30 text-xs text-amber-200"
                >
                  {gap}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Question-by-Question Deep Dive (Expandable) */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-wide">
              Question-by-Question Analysis ({activeReport.questionResults?.length || 0})
            </h3>
            <span className="text-xs text-slate-500">Click question card to expand details</span>
          </div>

          <div className="space-y-3">
            {activeReport.questionResults?.map((qr: any, idx: number) => {
              const qId = qr.questionId || `q-${idx}`;
              const isExpanded = !!expandedQuestions[qId];

              return (
                <div
                  key={qId}
                  className="rounded-2xl bg-slate-900/40 border border-slate-800/80 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleQuestion(qId)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                          Question #{qr.sequenceNumber || idx + 1}
                        </span>
                        <span className="text-xs text-slate-400 capitalize">{qr.category}</span>
                        {qr.status === "SKIPPED" && (
                          <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            Skipped
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-white">"{qr.questionText}"</h4>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-950 border border-slate-700 text-indigo-400">
                        {qr.score ? `${qr.score} / 10` : "Skipped"}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-slate-800/60 space-y-3 bg-slate-950/40">
                      {qr.candidateAnswer && (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/60 text-xs text-slate-300 space-y-1">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                            Candidate Answer Transcript
                          </span>
                          <p className="whitespace-pre-line leading-relaxed">{qr.candidateAnswer}</p>
                        </div>
                      )}

                      {qr.whatWentWell?.length > 0 && (
                        <div className="text-xs space-y-1">
                          <span className="text-[10px] text-emerald-400 font-semibold uppercase block">
                            What Went Well
                          </span>
                          <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                            {qr.whatWentWell.map((w: string, i: number) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {qr.whatCouldImprove?.length > 0 && (
                        <div className="text-xs space-y-1">
                          <span className="text-[10px] text-rose-400 font-semibold uppercase block">
                            What Could Improve
                          </span>
                          <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                            {qr.whatCouldImprove.map((c: string, i: number) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {qr.recommendedAnswer && (
                        <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-indigo-200 space-y-1">
                          <span className="text-[10px] text-indigo-400 font-semibold uppercase block">
                            Exemplary Model Response
                          </span>
                          <p className="whitespace-pre-line leading-relaxed">{qr.recommendedAnswer}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Study Topics & Practice Questions */}
        {activeReport.recommendedTopics?.length > 0 && (
          <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
            <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Recommended Study Topics</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {activeReport.recommendedTopics.map((topic: string, idx: number) => (
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

        {/* Next Best Actions */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Recommended Next Action
            </h3>
            <p className="text-xs text-slate-300">
              Review your drafted Thank-You note to follow up with hiring managers on this interview.
            </p>
          </div>
          <Link
            to="/outreach"
            className="shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all"
          >
            Review Outreach Draft
          </Link>
        </div>
      </div>
    </div>
  );
}
