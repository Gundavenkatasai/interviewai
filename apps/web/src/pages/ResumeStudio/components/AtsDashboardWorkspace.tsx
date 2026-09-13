import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, ChevronRight, BookOpen, Clock, BarChart3, Bot, Search } from "lucide-react";
import { ApiClient } from "../../../lib/api";

interface AtsDashboardWorkspaceProps {
  resumeId: string;
}

export const AtsDashboardWorkspace: React.FC<AtsDashboardWorkspaceProps> = ({ resumeId }) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "issues" | "what-ats-sees" | "history">("overview");
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    fetchAtsReport();
  }, [resumeId]);

  const fetchAtsReport = async () => {
    try {
      const res = await ApiClient.getAtsReport(resumeId);
      if (res?.report) {
        setReport(res.report);
      }
    } catch (err) {
      console.error("Failed to fetch ATS report", err);
    } finally {
      setLoading(false);
    }
  };

  const explainScore = async () => {
    if (!report?._id) return;
    setLoadingAi(true);
    try {
      const res = await ApiClient.explainAtsReport(resumeId, report._id);
      if (res?.explanation) {
        setAiExplanation(res.explanation);
      }
    } catch (err) {
      console.error("AI explanation failed", err);
    } finally {
      setLoadingAi(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] bg-slate-50">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500">Loading ATS Analysis...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] bg-slate-50">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Scan Not Found</h2>
        <p className="text-slate-500 mt-2">Run an ATS scan to see how your resume performs.</p>
        <button onClick={fetchAtsReport} className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Run Scan
        </button>
      </div>
    );
  }

  const criticalIssues = report.issues?.filter((i: any) => i.severity === "critical" || i.severity === "high") || [];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            ATS Score Dashboard
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              v{report.scoringVersion || "1.0"}
            </span>
          </h1>
          <p className="text-sm text-slate-500">Deterministic ATS Evaluation & Artifact Analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-700">Back to Dashboard</Link>
          <button onClick={fetchAtsReport} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition">
            <RefreshCw className="w-4 h-4" /> Rescan Artifact
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col md:flex-row gap-6">
        
        {/* Left Column: Nav & Score */}
        <div className="w-full md:w-64 flex flex-col gap-6 shrink-0">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center">
            <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-slate-100">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-100" />
                <circle
                  cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="8"
                  className={report.overallScore >= 80 ? "text-emerald-500" : report.overallScore >= 60 ? "text-amber-500" : "text-rose-500"}
                  strokeDasharray={`${report.overallScore * 2.89} 289`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <span className="text-3xl font-bold text-slate-900">{report.overallScore}</span>
                <span className="block text-xs font-medium text-slate-500 uppercase">Score</span>
              </div>
            </div>
            
            <div className="mt-6 w-full space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Parsing</span>
                <span className="font-semibold text-slate-900">{report.categories?.parsing || 0}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Structure</span>
                <span className="font-semibold text-slate-900">{report.categories?.structure || 0}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Formatting</span>
                <span className="font-semibold text-slate-900">{report.categories?.formatting || 0}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Keywords</span>
                <span className="font-semibold text-slate-900">{report.categories?.keywords || 0}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Job Alignment</span>
                <span className="font-semibold text-slate-900">{report.categories?.jobAlignment || 0}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Content</span>
                <span className="font-semibold text-slate-900">{report.categories?.content || 0}%</span>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            <button onClick={() => setActiveTab("overview")} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === "overview" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}>
              <BarChart3 className="w-5 h-5" /> Score Breakdown
            </button>
            <button onClick={() => setActiveTab("issues")} className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition ${activeTab === "issues" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}>
              <div className="flex items-center gap-3"><AlertTriangle className="w-5 h-5" /> Fix First</div>
              {criticalIssues.length > 0 && <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">{criticalIssues.length}</span>}
            </button>
            <button onClick={() => setActiveTab("what-ats-sees")} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === "what-ats-sees" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}>
              <Search className="w-5 h-5" /> What ATS Sees
            </button>
            <button onClick={() => setActiveTab("history")} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === "history" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}>
              <Clock className="w-5 h-5" /> Scan History
            </button>
          </nav>
        </div>

        {/* Right Column: Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          {/* AI Explanation Banner */}
          <div className="bg-white rounded-2xl p-6 border border-indigo-100 shadow-sm flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" /> Explain My Score
              </h3>
              <p className="text-sm text-slate-600 mt-1">Get an AI-generated summary of your deterministic findings without fabricating results.</p>
              {aiExplanation && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-sm text-indigo-900 leading-relaxed">
                  {aiExplanation}
                </div>
              )}
            </div>
            {!aiExplanation && (
              <button onClick={explainScore} disabled={loadingAi} className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap">
                {loadingAi ? "Analyzing..." : "Generate Explanation"}
              </button>
            )}
          </div>

          {/* Dynamic Tab Content */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
            {activeTab === "overview" && (
              <div className="p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Score Evidence & Dimensions</h2>
                <div className="space-y-8">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Parsing & Extractability ({report.categories?.parsing || 0}/100)
                    </h4>
                    <p className="text-sm text-slate-600">The ATS successfully extracted text from your artifact. Multi-column formats or heavy graphics can severely reduce this score.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Job Alignment ({report.categories?.jobAlignment || 0}/100)
                    </h4>
                    <p className="text-sm text-slate-600">We differentiate between <strong>Unknown</strong> and <strong>Missing</strong> semantics. If you didn't provide a Job Description, we fallback to generic Software Engineering roles.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "issues" && (
              <div className="p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Fix First Priority List</h2>
                {criticalIssues.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No Critical Issues</h3>
                    <p className="text-slate-500">Your resume artifact parses safely and contains core required elements.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {criticalIssues.map((issue: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex gap-4">
                        <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
                        <div>
                          <h4 className="font-bold text-rose-900">{issue.problem}</h4>
                          <p className="text-sm text-rose-700 mt-1">{issue.whyItMatters}</p>
                          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white rounded-lg text-xs font-semibold text-slate-700 border border-rose-200">
                            Fix: {issue.suggestedFix}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "what-ats-sees" && (
              <div className="p-8 h-full flex flex-col">
                <h2 className="text-xl font-bold text-slate-900 mb-6">ATS Text Extraction</h2>
                <div className="flex-1 bg-slate-900 rounded-xl p-6 overflow-auto font-mono text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {/* Ideally fetch rawText or plain-text endpoint, just showing placeholder for now */}
                  {"[ Extracted Document Text Representation ]\n\nNote: If sections appear garbled or out of order, the ATS cannot interpret your resume accurately. Avoid tables and multi-column designs for maximum compatibility."}
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Immutable Scan History</h2>
                <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">Version {report.scoringVersion || "1.0"}</h4>
                    <p className="text-sm text-slate-500">Score: {report.overallScore} | Evaluated {new Date(report.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Compare</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
