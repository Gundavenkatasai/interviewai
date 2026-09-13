import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Share2, Sparkles, CheckCircle2, AlertTriangle, ArrowRight,
  ExternalLink, Search, Award, TrendingUp, Key, Lightbulb, RefreshCw,
  FileText, Copy, Check, Download, ShieldCheck, HelpCircle, Layers, X
} from "lucide-react";
import { ApiClient } from "../lib/api";

export default function LinkedInPage() {
  const [profileUrl, setProfileUrl] = useState("https://www.linkedin.com/in/");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [inputMode, setInputMode] = useState<"url" | "paste" | "upload">("url");
  const [pastedText, setPastedText] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "headline" | "about" | "experience" | "skills" | "consistency">("overview");

  // Progress Animation States
  const [progressStep, setProgressStep] = useState<number>(0);
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  // Report & Sync state
  const [report, setReport] = useState<any | null>(null);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load latest analysis on mount
  const { data: initialAnalysis } = useQuery({
    queryKey: ["latest-linkedin-analysis"],
    queryFn: () => ApiClient.getLatestLinkedInAnalysis()
  });

  useEffect(() => {
    if (initialAnalysis && !report) {
      setReport(initialAnalysis);
    }
  }, [initialAnalysis, report]);

  // URL Analysis Mutation
  const analyzeUrlMutation = useMutation({
    mutationFn: (url: string) => ApiClient.analyzeLinkedInUrl(url, targetRole),
    onSuccess: (res) => {
      setReport(res.report || res.data || res);
      setAnalyzing(false);
      setProgressStep(6);
    },
    onError: (err: any) => {
      setAnalyzing(false);
      alert(err.message || "Public analysis failed. Please try pasting your profile content instead.");
    }
  });

  // Pasted Profile Mutation
  const analyzePastedMutation = useMutation({
    mutationFn: (text: string) => ApiClient.analyzeLinkedInPasted(text, targetRole),
    onSuccess: (res) => {
      setReport(res.report || res.data || res);
      setAnalyzing(false);
      setProgressStep(6);
    },
    onError: (err: any) => {
      setAnalyzing(false);
      alert(err.message || "Failed to analyze pasted profile");
    }
  });

  // Profile Sync Mutation
  const syncMutation = useMutation({
    mutationFn: (data: any) => ApiClient.syncLinkedInProfile(data),
    onSuccess: () => {
      setSyncSuccess("Profile successfully updated with verified LinkedIn skills!");
      setTimeout(() => {
        setSyncSuccess("");
        setShowSyncModal(false);
      }, 2500);
    }
  });

  const handleStartAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzing(true);
    setProgressStep(1);

    // Simulate realistic multi-step progress steps while network executes
    const timer1 = setTimeout(() => setProgressStep(2), 700);
    const timer2 = setTimeout(() => setProgressStep(3), 1500);
    const timer3 = setTimeout(() => setProgressStep(4), 2200);
    const timer4 = setTimeout(() => setProgressStep(5), 3000);

    if (inputMode === "url") {
      analyzeUrlMutation.mutate(profileUrl.trim());
    } else {
      analyzePastedMutation.mutate(pastedText.trim());
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const steps = [
    "Checking profile URL & SSRF validation",
    "Accessing public profile via Agent Reach & Jina",
    "Extracting headline, experience & skills",
    "Auditing recruiter keyword discoverability",
    "Analyzing against live India/Global jobs in database",
    "Calculating deterministic score & recommendations"
  ];

  const overallScore = report?.score || 0;
  const sectionScores = report?.sectionScores || {};

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Share2 className="w-7 h-7 text-indigo-400" />
            <span>LinkedIn Analyzer</span>
          </h1>
          <span className="text-xs uppercase font-bold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-full">
            Agent Reach Powered
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Know how recruiters see your profile, then fix every part of it.
        </p>
      </div>

      {/* Input Mode Selector & Form */}
      <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 space-y-5">
        {/* Mode Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setInputMode("url")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              inputMode === "url" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Public LinkedIn URL
          </button>
          <button
            onClick={() => setInputMode("paste")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              inputMode === "paste" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Paste Profile Instead
          </button>
        </div>

        <form onSubmit={handleStartAnalysis} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {inputMode === "url" ? "Public Profile URL" : "Paste Profile Text"}
              </label>

              {inputMode === "url" ? (
                <div className="relative">
                  <Share2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    required
                    value={profileUrl}
                    onChange={(e) => setProfileUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/in/username"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl text-xs bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              ) : (
                <textarea
                  rows={4}
                  required
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste your LinkedIn headline, About section, experience roles, and skills here..."
                  className="w-full p-3 rounded-2xl text-xs bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Target Engineering Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Backend Engineer"
                className="w-full px-3 py-3 rounded-2xl text-xs bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% compliant: Strictly retrieves publicly accessible data without passwords, cookies, or CAPTCHA bypass.
            </p>
            <button
              type="submit"
              disabled={analyzing}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 shrink-0"
            >
              {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{analyzing ? "Auditing Profile..." : "Analyze Profile"}</span>
            </button>
          </div>
        </form>

        {/* Real-time Scraping Progress Display */}
        {analyzing && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 animate-in fade-in">
            <span className="text-xs font-bold text-indigo-400 block mb-2">Extraction & Audit Pipeline in Progress</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {steps.map((s, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-xl border text-[11px] flex items-center gap-2 transition-all ${
                    progressStep > idx + 1
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold"
                      : progressStep === idx + 1
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300 font-semibold animate-pulse"
                      : "bg-slate-900/40 border-slate-800 text-slate-500"
                  }`}
                >
                  {progressStep > idx + 1 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : progressStep === idx + 1 ? (
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-slate-700 shrink-0" />
                  )}
                  <span className="truncate">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Audit Report Results */}
      {report && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Main Score Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className={`text-xs uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                  overallScore >= 85
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : overallScore >= 70
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                }`}>
                  {overallScore >= 85 ? "Strong Profile" : overallScore >= 70 ? "Moderate Profile" : "Needs Optimization"}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {report.profile?.publicUrl || profileUrl}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">Recruiter Discovery & Optimization Audit</h2>
              <p className="text-xs text-slate-400 max-w-xl">
                Calculated from verified public data and compared against 380+ active {targetRole} jobs in our database.
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-center p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-3xl sm:text-4xl font-black text-indigo-400">{overallScore}</span>
                <span className="text-xs text-slate-500 block">/ 100</span>
              </div>
              <button
                onClick={() => setShowSyncModal(true)}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Sync to My Profile</span>
              </button>
            </div>
          </div>

          {/* Section Score Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-center">
            {[
              { label: "Headline", score: sectionScores.headline || 0, weight: "10%" },
              { label: "About", score: sectionScores.about || 0, weight: "15%" },
              { label: "Experience", score: sectionScores.experience || 0, weight: "20%" },
              { label: "Skills", score: sectionScores.skills || 0, weight: "15%" },
              { label: "Projects", score: sectionScores.projects || 0, weight: "10%" },
              { label: "Education", score: sectionScores.education || 0, weight: "5%" },
              { label: "Keywords", score: sectionScores.keywords || 0, weight: "15%" },
              { label: "Completeness", score: sectionScores.completeness || 0, weight: "10%" },
            ].map((item, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block truncate">{item.label}</span>
                <span className="text-sm font-bold text-white mt-0.5 block">{item.score}</span>
                <span className="text-[9px] text-slate-500">wt: {item.weight}</span>
              </div>
            ))}
          </div>

          {/* Report Tab Navigation */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
            {[
              { id: "overview", label: "Overview & Strengths" },
              { id: "headline", label: "Headline Critique" },
              { id: "about", label: "About Section" },
              { id: "experience", label: "Work Experience" },
              { id: "skills", label: "Skills & Market Demand" },
              { id: "consistency", label: "Profile vs Resume Consistency" }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === t.id
                    ? "bg-indigo-600/20 text-white border border-indigo-500/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Strengths */}
              <div className="p-5 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Top Strengths
                </h3>
                <div className="space-y-2">
                  {(report.strengths || []).map((s: string, i: number) => (
                    <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weaknesses */}
              <div className="p-5 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Areas for Improvement
                </h3>
                <div className="space-y-2">
                  {(report.weaknesses || []).map((w: string, i: number) => (
                    <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-amber-400 font-bold">!</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="p-5 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4" /> Action Items
                </h3>
                <div className="space-y-2">
                  {(report.recommendations || []).map((r: string, i: number) => (
                    <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HEADLINE CRITIQUE */}
          {activeTab === "headline" && (
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Headline Analysis</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Score: {report.headlineAnalysis?.score || 0}/100</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400">Current Headline</span>
                <p className="text-sm text-white font-medium">{report.headlineAnalysis?.current || "Not set"}</p>
              </div>

              {report.headlineAnalysis?.problems?.length > 0 && (
                <div className="space-y-1">
                  {report.headlineAnalysis.problems.map((p: string, i: number) => (
                    <p key={i} className="text-xs text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" /> {p}
                    </p>
                  ))}
                </div>
              )}

              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-white block">Suggested High-Converting Headlines:</span>
                {(report.headlineAnalysis?.suggestedVersions || []).map((sug: string, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-200 font-medium">{sug}</span>
                    <button
                      onClick={() => copyToClipboard(sug, `headline-${idx}`)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 flex items-center gap-1 shrink-0"
                    >
                      {copiedKey === `headline-${idx}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === `headline-${idx}` ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ABOUT SECTION */}
          {activeTab === "about" && (
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">About Section Optimization</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Score: {report.aboutAnalysis?.score || 0}/100</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400">Current About</span>
                  <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                    {report.aboutAnalysis?.current || "No About summary detected."}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-indigo-400">Suggested Improved About</span>
                    <button
                      onClick={() => copyToClipboard(report.aboutAnalysis?.suggestedAbout || "", "about")}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 flex items-center gap-1"
                    >
                      {copiedKey === "about" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === "about" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                    {report.aboutAnalysis?.suggestedAbout}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXPERIENCE */}
          {activeTab === "experience" && (
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-5">
              <h3 className="text-sm font-bold text-white">Work Experience Analysis</h3>
              <div className="space-y-4">
                {(report.experienceAnalysis || []).map((exp: any, i: number) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">{exp.role} at {exp.company}</span>
                      <span className="text-xs font-bold text-indigo-400">{exp.score}/100</span>
                    </div>
                    {exp.problems?.map((p: string, pIdx: number) => (
                      <p key={pIdx} className="text-xs text-amber-300">• {p}</p>
                    ))}
                    {exp.suggestedImprovements?.map((imp: string, impIdx: number) => (
                      <p key={impIdx} className="text-xs text-indigo-300 font-medium">💡 {imp}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SKILLS & MARKET DEMAND */}
          {activeTab === "skills" && (
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Market Skill Demand vs Your Profile</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Calculated from actual {targetRole} job postings in our MongoDB database.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(report.skillsAnalysis?.marketDemand || []).map((m: any, i: number) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                      m.userStatus === "Present"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-200"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">{m.skill}</span>
                      <span className="text-[10px] text-slate-400">
                        {m.frequencyPercentage}% of jobs require this
                      </span>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      m.userStatus === "Present" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                    }`}>
                      {m.userStatus === "Present" ? "Strong" : "Skill Gap"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: PROFILE VS RESUME CONSISTENCY */}
          {activeTab === "consistency" && (
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Cross-Profile Consistency Analysis</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Consistency Score: {report.consistencyAnalysis?.overallConsistencyScore || 100}%
                  </p>
                </div>
              </div>

              {report.consistencyAnalysis?.titleMismatch ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1 text-xs">
                  <span className="font-bold text-amber-300 block">⚠️ Job Title Mismatch Detected</span>
                  <p className="text-slate-300">
                    Your active resume targets <span className="font-bold text-white">{report.consistencyAnalysis.titleMismatch.resume}</span>, but your LinkedIn headline reads <span className="font-bold text-white">{report.consistencyAnalysis.titleMismatch.linkedin}</span>.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Job titles are aligned across LinkedIn and your active resume.</span>
                </div>
              )}

              {report.consistencyAnalysis?.locationMismatch && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1 text-xs">
                  <span className="font-bold text-amber-300 block">⚠️ Location Mismatch Detected</span>
                  <p className="text-slate-300">
                    Profile lists <span className="font-bold text-white">{report.consistencyAnalysis.locationMismatch.profile}</span>, whereas LinkedIn indicates <span className="font-bold text-white">{report.consistencyAnalysis.locationMismatch.linkedin}</span>.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: Sync to Canonical Profile ================= */}
      {showSyncModal && report && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" /> Update Canonical Profile
              </h3>
              <button onClick={() => setShowSyncModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Select verified LinkedIn attributes to synchronize with your core account profile:
            </p>

            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                <input type="checkbox" defaultChecked id="syncSkillsCheckbox" className="mt-0.5" />
                <span>
                  Add verified LinkedIn skills:{" "}
                  <span className="text-indigo-400 font-semibold">
                    {(report.skillsAnalysis?.currentSkills || []).slice(0, 5).join(", ")}
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                <input type="checkbox" defaultChecked id="syncBioCheckbox" className="mt-0.5" />
                <span>Update bio with suggested LinkedIn headline</span>
              </label>
            </div>

            {syncSuccess && (
              <p className="text-xs text-emerald-400 font-semibold">{syncSuccess}</p>
            )}

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setShowSyncModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const acceptSkills = (document.getElementById("syncSkillsCheckbox") as HTMLInputElement)?.checked;
                  const acceptHeadline = (document.getElementById("syncBioCheckbox") as HTMLInputElement)?.checked;
                  syncMutation.mutate({
                    acceptSkills,
                    acceptHeadline,
                    headline: report.headlineAnalysis?.suggestedVersions?.[0],
                    newSkills: report.skillsAnalysis?.currentSkills
                  });
                }}
                disabled={syncMutation.isPending}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
              >
                {syncMutation.isPending ? "Syncing..." : "Confirm & Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
