"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Upload, FileText, Briefcase, Layers, CheckCircle,
  AlertCircle, Brain, Code2, Database, Globe, Server, Cloud,
  BarChart2, Shield, Cpu, GitBranch, X, ChevronRight, Loader2
} from "lucide-react";
import { ApiClient } from "@/lib/api";

// ──────────────────────────────────────────────────────────────────────────────
// Role definitions with icons and associated topics
// ──────────────────────────────────────────────────────────────────────────────
const ROLES = [
  { id: "full-stack", label: "Full Stack Developer", icon: Layers, color: "from-violet-500 to-purple-600" },
  { id: "frontend", label: "Frontend Developer", icon: Globe, color: "from-blue-500 to-cyan-500" },
  { id: "backend", label: "Backend Developer", icon: Server, color: "from-emerald-500 to-teal-600" },
  { id: "data-scientist", label: "Data Scientist", icon: BarChart2, color: "from-orange-500 to-amber-500" },
  { id: "ml-engineer", label: "ML Engineer", icon: Brain, color: "from-pink-500 to-rose-500" },
  { id: "ai-engineer", label: "AI Engineer", icon: Cpu, color: "from-indigo-500 to-blue-600" },
  { id: "devops", label: "DevOps Engineer", icon: GitBranch, color: "from-slate-500 to-gray-600" },
  { id: "cloud", label: "Cloud Engineer", icon: Cloud, color: "from-sky-500 to-blue-500" },
  { id: "software-engineer", label: "Software Engineer", icon: Code2, color: "from-cyan-500 to-teal-500" },
  { id: "data-analyst", label: "Data Analyst", icon: Database, color: "from-yellow-500 to-orange-500" },
  { id: "java-dev", label: "Java Developer", icon: Briefcase, color: "from-red-500 to-rose-600" },
  { id: "python-dev", label: "Python Developer", icon: Code2, color: "from-blue-400 to-indigo-500" },
  { id: "react-dev", label: "React Developer", icon: Globe, color: "from-cyan-400 to-sky-500" },
  { id: "security", label: "Security Engineer", icon: Shield, color: "from-red-600 to-orange-500" },
  { id: "custom", label: "Custom Role", icon: Sparkles, color: "from-purple-400 to-violet-500" },
];

const EXPERIENCE_LEVELS = ["Fresher", "0-2 years", "2-5 years", "5+ years"];
const INTERVIEW_TYPES = [
  "Technical", "HR", "Behavioral", "Project Deep-Dive",
  "System Design", "Coding", "Mixed"
];
const DIFFICULTIES = ["Easy", "Medium", "Hard", "Adaptive"];
const QUESTION_COUNTS = [5, 10, 15, 20];
const COACH_MODES = [
  { id: "practice", label: "Practice Mode", desc: "Hints enabled, coaching feedback" },
  { id: "interview", label: "Interview Mode", desc: "Strict evaluation, no hints" },
  { id: "review", label: "Review Mode", desc: "Focus on missing concepts" },
];

export default function SetupPage() {
  const router = useRouter();

  // Core state
  const [selectedRoleId, setSelectedRoleId] = useState("full-stack");
  const [customRole, setCustomRole] = useState("");
  const [company, setCompany] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("0-2 years");
  const [interviewType, setInterviewType] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Medium");
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [technologies, setTechnologies] = useState("React, Node.js, MongoDB");
  const [coachMode, setCoachMode] = useState<"practice" | "interview" | "review">("interview");

  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeSummary, setResumeSummary] = useState<any | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [jobDescriptionText, setJobDescriptionText] = useState("");

  // UI state
  const [step, setStep] = useState(1); // 1: Role | 2: Config | 3: Resume
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("interviewai_current_session");
      localStorage.removeItem("interviewai_current_question_index");
    }
  }, []);

  const selectedRoleObj = ROLES.find(r => r.id === selectedRoleId)!;
  const roleLabel = selectedRoleId === "custom" ? (customRole || "Custom Role") : selectedRoleObj.label;

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeFile(file);
    setIsUploadingResume(true);
    setError(null);
    try {
      const res = await ApiClient.uploadResume(file);
      setResumeId(res.resume_id);
      setResumeSummary(res.analysis);
      if (res.analysis?.skills?.length) {
        setTechnologies(res.analysis.skills.slice(0, 8).join(", "));
      }
    } catch (err: any) {
      setError(err.message || "Failed to parse resume document.");
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      const techArray = technologies.split(",").map(t => t.trim()).filter(Boolean);
      const session = await ApiClient.createInterview({
        role: roleLabel,
        company: company || undefined,
        experience_level: experienceLevel,
        interview_type: interviewType,
        difficulty,
        technologies: techArray,
        coach_mode: coachMode,
        duration_minutes: maxQuestions * 4,
        max_questions: maxQuestions,
        resume_id: resumeId || undefined,
        job_description_text: jobDescriptionText || undefined,
      });
      router.push(`/interview/${session.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to start interview. Please try again.");
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // ── Step indicators ──
  const steps = ["Choose Role", "Configure", "Resume & Start"];

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0d0d1a]/80 backdrop-blur-lg sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">InterviewAI</span>
          </div>
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <button suppressHydrationWarning
                  onClick={() => i + 1 < step && setStep(i + 1)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    i + 1 === step
                      ? "bg-violet-500/20 text-violet-300 border border-violet-500/40"
                      : i + 1 < step
                      ? "bg-emerald-500/20 text-emerald-400 cursor-pointer hover:bg-emerald-500/30"
                      : "text-white/30"
                  }`}
                >
                  {i + 1 < step ? <CheckCircle className="w-3 h-3" /> : <span>{i + 1}</span>}
                  {s}
                </button>
                {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-white/20" />}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* ── STEP 1: Role Selection ── */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-bold mb-2">Select Your Target Role</h1>
              <p className="text-white/50">Choose the role you're interviewing for. Questions will be tailored to this role's specific skill set.</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {ROLES.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRoleId === role.id;
                return (
                  <button suppressHydrationWarning
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all duration-200 text-center group ${
                      isSelected
                        ? "border-violet-500/60 bg-violet-500/10 shadow-lg shadow-violet-500/10"
                        : "border-white/5 bg-white/3 hover:border-white/15 hover:bg-white/6"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${isSelected ? "scale-110" : ""}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className={`text-xs font-medium leading-tight ${isSelected ? "text-violet-200" : "text-white/70"}`}>
                      {role.label}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedRoleId === "custom" && (
              <div className="max-w-md">
                <label className="text-sm text-white/60 mb-2 block">Custom Role Title</label>
                <input suppressHydrationWarning
                  type="text"
                  value={customRole}
                  onChange={e => setCustomRole(e.target.value)}
                  placeholder="e.g. React Native Developer"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
                />
              </div>
            )}

            <div className="flex justify-end">
              <button suppressHydrationWarning
                onClick={() => setStep(2)}
                disabled={selectedRoleId === "custom" && !customRole.trim()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:from-violet-500 hover:to-purple-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Configure Interview ── */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedRoleObj.color} flex items-center justify-center`}>
                  {(() => { const Icon = selectedRoleObj.icon; return <Icon className="w-4 h-4 text-white" />; })()}
                </div>
                <h1 className="text-3xl font-bold">{roleLabel}</h1>
              </div>
              <p className="text-white/50">Configure interview parameters to match your practice goals.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Number of Questions */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-white/70 mb-3 block">Number of Questions</label>
                <div className="grid grid-cols-4 gap-3">
                  {QUESTION_COUNTS.map(n => (
                    <button suppressHydrationWarning
                      key={n}
                      onClick={() => setMaxQuestions(n)}
                      className={`py-3 rounded-xl font-bold text-lg transition-all ${
                        maxQuestions === n
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30 scale-105"
                          : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
                      }`}
                    >
                      {n}
                      <div className="text-xs font-normal mt-0.5 opacity-70">
                        {n === 5 ? "~15 min" : n === 10 ? "~30 min" : n === 15 ? "~45 min" : "~60 min"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <label className="text-sm font-medium text-white/70 mb-3 block">Experience Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPERIENCE_LEVELS.map(level => (
                    <button suppressHydrationWarning
                      key={level}
                      onClick={() => setExperienceLevel(level)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                        experienceLevel === level
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                          : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="text-sm font-medium text-white/70 mb-3 block">Difficulty</label>
                <div className="grid grid-cols-2 gap-2">
                  {DIFFICULTIES.map(d => {
                    const colors: Record<string, string> = {
                      Easy: "from-emerald-600 to-teal-600",
                      Medium: "from-yellow-600 to-amber-600",
                      Hard: "from-red-600 to-rose-600",
                      Adaptive: "from-violet-600 to-purple-600"
                    };
                    return (
                      <button suppressHydrationWarning
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                          difficulty === d
                            ? `bg-gradient-to-r ${colors[d]} text-white shadow-lg`
                            : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interview Type */}
              <div>
                <label className="text-sm font-medium text-white/70 mb-3 block">Interview Type</label>
                <div className="flex flex-wrap gap-2">
                  {INTERVIEW_TYPES.map(t => (
                    <button suppressHydrationWarning
                      key={t}
                      onClick={() => setInterviewType(t)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                        interviewType === t
                          ? "bg-violet-600 text-white"
                          : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coach Mode */}
              <div>
                <label className="text-sm font-medium text-white/70 mb-3 block">Mode</label>
                <div className="space-y-2">
                  {COACH_MODES.map(m => (
                    <button suppressHydrationWarning
                      key={m.id}
                      onClick={() => setCoachMode(m.id as any)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
                        coachMode === m.id
                          ? "bg-violet-600/20 border border-violet-500/50 text-white"
                          : "bg-white/3 border border-white/8 text-white/60 hover:bg-white/6"
                      }`}
                    >
                      {coachMode === m.id && <CheckCircle className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />}
                      {coachMode !== m.id && <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0 mt-0.5" />}
                      <div>
                        <div className="text-sm font-medium">{m.label}</div>
                        <div className="text-xs opacity-60 mt-0.5">{m.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Company */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-white/70 mb-2 block">Target Company (optional)</label>
                <input suppressHydrationWarning
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="e.g. Google, Stripe, Startup..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                />
              </div>

              {/* Technologies */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-white/70 mb-2 block">Key Technologies</label>
                <input suppressHydrationWarning
                  type="text"
                  value={technologies}
                  onChange={e => setTechnologies(e.target.value)}
                  placeholder="React, Node.js, PostgreSQL, Docker..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                />
                <p className="text-xs text-white/35 mt-1.5">Comma-separated. These guide question topic selection.</p>
              </div>
            </div>

            <div className="flex justify-between">
              <button suppressHydrationWarning
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 transition-all border border-white/10"
              >
                Back
              </button>
              <button suppressHydrationWarning
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/20"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Resume & Launch ── */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-bold mb-2">Resume & Launch</h1>
              <p className="text-white/50">Upload your resume for personalized, resume-specific questions. This is the most powerful feature.</p>
            </div>

            {/* Session Summary */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
              <h3 className="text-sm font-medium text-white/50 mb-4 uppercase tracking-wider">Interview Configuration</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Role", value: roleLabel },
                  { label: "Questions", value: `${maxQuestions} questions` },
                  { label: "Difficulty", value: difficulty },
                  { label: "Type", value: interviewType },
                  { label: "Experience", value: experienceLevel },
                  { label: "Mode", value: coachMode },
                  company ? { label: "Company", value: company } : null,
                ].filter(Boolean).map((item: any) => (
                  <div key={item.label}>
                    <div className="text-xs text-white/40 mb-1">{item.label}</div>
                    <div className="text-sm font-medium text-white">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resume Upload */}
            <div>
              <input suppressHydrationWarning
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleResumeUpload}
                className="hidden"
                id="resume-upload"
              />

              {!resumeFile ? (
                <label
                  htmlFor="resume-upload"
                  className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-white/15 rounded-2xl p-10 cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/5 transition-all group"
                >
                  {isUploadingResume ? (
                    <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-7 h-7 text-violet-400" />
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-white font-medium mb-1">
                      {isUploadingResume ? "Parsing your resume with AI..." : "Upload Resume (Optional but Highly Recommended)"}
                    </div>
                    <div className="text-sm text-white/40">PDF, DOCX, or TXT · Max 10MB</div>
                  </div>
                  {!isUploadingResume && (
                    <div className="flex items-center gap-2 text-xs text-white/30">
                      <Sparkles className="w-3 h-3" />
                      <span>AI extracts projects & skills to generate personalized questions</span>
                    </div>
                  )}
                </label>
              ) : (
                <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="font-medium text-emerald-300">{resumeFile.name}</div>
                        <div className="text-xs text-white/40">{(resumeFile.size / 1024).toFixed(0)} KB</div>
                      </div>
                    </div>
                    <button suppressHydrationWarning
                      onClick={() => { setResumeFile(null); setResumeId(null); setResumeSummary(null); }}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {resumeSummary && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Resume analyzed successfully
                      </div>
                      {resumeSummary.skills?.length > 0 && (
                        <div>
                          <div className="text-xs text-white/40 mb-2">Detected Skills</div>
                          <div className="flex flex-wrap gap-1.5">
                            {resumeSummary.skills.slice(0, 12).map((s: string) => (
                              <span key={s} className="px-2 py-0.5 bg-emerald-500/15 text-emerald-300 rounded-md text-xs border border-emerald-500/20">{s}</span>
                            ))}
                            {resumeSummary.skills.length > 12 && (
                              <span className="px-2 py-0.5 text-white/30 text-xs">+{resumeSummary.skills.length - 12} more</span>
                            )}
                          </div>
                        </div>
                      )}
                      {resumeSummary.projects?.length > 0 && (
                        <div>
                          <div className="text-xs text-white/40 mb-2">Detected Projects ({resumeSummary.projects.length})</div>
                          <div className="flex flex-wrap gap-1.5">
                            {resumeSummary.projects.slice(0, 4).map((p: any) => (
                              <span key={p.name} className="px-2.5 py-1 bg-blue-500/10 text-blue-300 rounded-lg text-xs border border-blue-500/20">
                                {p.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Job Description */}
            <div>
              <label className="text-sm font-medium text-white/70 mb-2 block">Job Description (optional)</label>
              <textarea suppressHydrationWarning
                value={jobDescriptionText}
                onChange={e => setJobDescriptionText(e.target.value)}
                placeholder="Paste the job description here for role-specific questions based on the JD requirements..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 resize-none"
              />
            </div>

            {/* Launch Button */}
            <div className="flex items-center justify-between">
              <button suppressHydrationWarning
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 transition-all border border-white/10"
              >
                Back
              </button>
              <button suppressHydrationWarning
                onClick={handleSubmit}
                disabled={isSubmitting || isUploadingResume}
                className="flex items-center gap-3 px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:from-violet-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-violet-500/25"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating first question...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Start Interview ({maxQuestions} questions)
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
