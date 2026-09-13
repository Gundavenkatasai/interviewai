import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Upload, FileText, CheckCircle2, AlertTriangle, AlertCircle, X,
  Sparkles, RefreshCw, Download, Copy, Check, Eye, ArrowRight,
  ShieldCheck, TrendingUp, Layers, Briefcase, GraduationCap,
  Search, Printer, HelpCircle, ChevronDown, ChevronUp, ChevronRight
} from "lucide-react";
import { ApiClient, ATSReport, ATSIssue, IOptimizationPlan, IBeforeAfterReport } from "../lib/api";
import { OptimizationReviewModal } from "./ResumeStudio/components/OptimizationReviewModal";
import { BeforeAfterReport } from "./ResumeStudio/components/BeforeAfterReport";
import { ResumeTemplateWorkspace } from "./ResumeStudio/components/ResumeTemplateWorkspace";
import { CanonicalResumeWorkspace } from "./ResumeStudio/components/CanonicalResumeWorkspace";
import { AtsDashboardWorkspace } from "./ResumeStudio/components/AtsDashboardWorkspace";

const DEFAULT_CATEGORIES = [
  {
    id: "software-engineering",
    name: "Software Engineering",
    roles: [
      "Software Engineer", "Full Stack Developer", "Frontend Developer", "Backend Developer",
      "Mobile App Developer", "React Developer", "Node.js Developer", "Python Developer",
      "Java Developer", "DevOps Engineer", "Cloud Engineer", "System Architect"
    ]
  },
  {
    id: "ai-data",
    name: "Artificial Intelligence & Data",
    roles: [
      "Data Scientist", "Data Analyst", "Machine Learning Engineer", "AI Engineer",
      "Data Engineer", "Business Intelligence Analyst", "NLP Engineer", "MLOps Engineer"
    ]
  },
  {
    id: "devops-cloud",
    name: "DevOps & Cloud",
    roles: [
      "DevOps Engineer", "Cloud Engineer", "AWS Engineer", "Azure Engineer",
      "Site Reliability Engineer (SRE)", "Platform Engineer", "Infrastructure Engineer"
    ]
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    roles: [
      "Cybersecurity Analyst", "Security Engineer", "Penetration Tester", "SOC Analyst",
      "Information Security Specialist"
    ]
  },
  {
    id: "product-project",
    name: "Product & Project Management",
    roles: ["Product Manager", "Technical Product Manager", "Project Manager", "Scrum Master", "Agile Coach"]
  },
  {
    id: "marketing",
    name: "Marketing & Growth",
    roles: ["Digital Marketing Specialist", "SEO Specialist", "Growth Marketer", "Content Strategist"]
  },
  {
    id: "finance-accounting",
    name: "Finance & Accounting",
    roles: ["Financial Analyst", "Accountant", "Finance Manager", "Auditor"]
  }
];

const SENIORITIES = ["Intern", "Entry / Junior", "Mid-level", "Senior", "Lead / Principal"];
const COUNTRIES = ["USA", "UK", "Canada", "Australia", "Germany", "India", "Singapore", "Bangladesh"];
const ATS_PROFILES = [
  { id: "generic", label: "Generic ATS", note: "Standard keyword + structure parsing, tolerant of minor formatting issues." },
  { id: "strict", label: "Strict / Legacy ATS", note: "Older enterprise systems (e.g. Taleo). Heavily penalizes tables, columns, graphics, and non-standard headers." },
  { id: "modern", label: "Modern / AI-assisted ATS", note: "Newer semantic engines. More forgiving of synonyms, but still penalizes missing key competencies." }
];

const SCAN_STEPS = [
  "Extracting document text layer and sections...",
  "Inspecting contact credentials & ATS structure...",
  "Scanning target keywords against requirements...",
  "Auditing formatting, typography & readability...",
  "Evaluating quantified achievement metrics & action verbs...",
  "Finalizing ATS score and generating prioritized fixes..."
];

export default function ResumeStudioPage() {
  // Workflow Mode: ATS Resume Templates (Workflow B) vs Format Preservation (Workflow A) vs Canonical (Day 7) vs ATS Dashboard (Day 8)
  const [workflowMode, setWorkflowMode] = useState<"templates" | "preservation" | "canonical" | "ats">(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "ats") return "ats";
    if (params.get("mode") === "preserve" || params.get("mode") === "checker") return "ats"; // Upgraded format preservation ATS checker
    if (params.get("mode") === "canonical") return "canonical";
    return "templates";
  });
  const resumeId = new URLSearchParams(window.location.search).get("id") || "";

  // Navigation & Flow
  const [stage, setStage] = useState<"input" | "analyzing" | "report" | "before_after">("input");
  const [scanStepIndex, setScanStepIndex] = useState(0);

  // Format-Preserving AI Optimization Suite states
  const [optimizationPlan, setOptimizationPlan] = useState<IOptimizationPlan | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [beforeAfterReport, setBeforeAfterReport] = useState<IBeforeAfterReport | null>(null);
  const [optimizedDocxBase64, setOptimizedDocxBase64] = useState<string | undefined>(undefined);

  // Input states
  const [inputTab, setInputTab] = useState<"file" | "text">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [showJd, setShowJd] = useState(false);

  // Target Role & Config states
  const [roleSearch, setRoleSearch] = useState("Software Engineer");
  const [roleCategory, setRoleCategory] = useState("software-engineering");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [seniority, setSeniority] = useState("Mid-level");
  const [country, setCountry] = useState("USA");
  const [atsProfileKey, setAtsProfileKey] = useState("generic");

  // Dynamic Metadata from Backend
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  // Result & Report state
  const [report, setReport] = useState<ATSReport | null>(null);
  const [issueFilter, setIssueFilter] = useState<"all" | "critical" | "high" | "medium" | "low">("all");
  const [showRawTextModal, setShowRawTextModal] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const roleSearchRef = useRef<HTMLDivElement>(null);

  // Load ATS Meta from backend on mount
  useEffect(() => {
    ApiClient.getAtsMeta()
      .then((res) => {
        if (res?.data?.categories?.length) {
          setCategories(res.data.categories);
        }
      })
      .catch(() => {
        // Fallback to DEFAULT_CATEGORIES
      });
  }, []);

  // Close role search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (roleSearchRef.current && !roleSearchRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext || "")) {
      setErrorMsg("Please upload a PDF, DOCX, or TXT file.");
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
  };

  // Run ATS Analysis
  const handleAnalyze = async () => {
    if (inputTab === "file" && !selectedFile) {
      setErrorMsg("Please select a resume file (PDF, DOCX, or TXT).");
      return;
    }
    if (inputTab === "text" && resumeText.trim().length < 30) {
      setErrorMsg("Please paste at least 30 characters of resume content.");
      return;
    }

    setErrorMsg(null);
    setStage("analyzing");
    setScanStepIndex(0);

    // Step simulation interval for visual feedback
    const interval = setInterval(() => {
      setScanStepIndex((prev) => {
        if (prev < SCAN_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 450);

    try {
      let res: { success: boolean; report: ATSReport; data: ATSReport };

      if (inputTab === "file" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("jdText", jdText);
        formData.append("roleCategory", roleCategory);
        formData.append("roleName", roleSearch || "Software Engineer");
        formData.append("seniority", seniority);
        formData.append("country", country);
        formData.append("atsProfileKey", atsProfileKey);
        formData.append("fileName", selectedFile.name);

        res = await ApiClient.checkAts(formData);
      } else {
        res = await ApiClient.checkAts({
          resumeText,
          jdText,
          roleCategory,
          roleName: roleSearch || "Software Engineer",
          seniority,
          country,
          atsProfileKey,
          fileName: "Pasted_Resume.txt"
        });
      }

      clearInterval(interval);
      setScanStepIndex(SCAN_STEPS.length - 1);

      // Brief delay to let the final checkmark show
      setTimeout(() => {
        setReport(res.report || res.data);
        setStage("report");
      }, 500);
    } catch (err: any) {
      clearInterval(interval);
      setStage("input");
      setErrorMsg(err.message || "Failed to analyze resume. Please try again.");
    }
  };

  // Generate Grounded Optimization Proposals
  const handleGeneratePlan = async () => {
    if (!report) return;
    setIsOptimizing(true);
    setErrorMsg(null);
    try {
      let res: any;
      if (inputTab === "file" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("jdText", jdText);
        formData.append("targetRole", roleSearch || "Software Engineer");
        formData.append("atsReport", JSON.stringify(report));
        if (report?.resumeTextPreview) {
          formData.append("resumeText", report.resumeTextPreview);
        }
        res = await ApiClient.generateOptimizationPlan(formData);
      } else {
        res = await ApiClient.generateOptimizationPlan({
          resumeText,
          jdText,
          targetRole: roleSearch || "Software Engineer",
          atsReport: report
        });
      }

      const plan = res?.plan || res?.data;
      if (plan && Array.isArray(plan.proposals) && plan.proposals.length > 0) {
        setOptimizationPlan(plan);
        setReviewModalOpen(true);
      } else {
        setErrorMsg("Could not generate actionable optimization proposals for this document. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate optimization plan. Please try again.");
    } finally {
      setIsOptimizing(false);
    }
  };

  // Apply Accepted Swaps to Original Document & Recalculate ATS
  const handleApplyOptimizations = async (
    selectedIds: string[],
    editedProposals: Record<string, string>
  ) => {
    if (!report || !optimizationPlan) return;
    setIsApplying(true);
    setErrorMsg(null);
    try {
      let res: any;
      if (inputTab === "file" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("acceptedProposalIds", JSON.stringify(selectedIds));
        formData.append("editedProposals", JSON.stringify(editedProposals));
        formData.append("proposals", JSON.stringify(optimizationPlan.proposals));
        formData.append("jdText", jdText);
        formData.append("targetRole", roleSearch || "Software Engineer");
        formData.append("roleCategory", roleCategory);
        formData.append("seniority", seniority);
        formData.append("country", country);
        formData.append("atsProfileKey", atsProfileKey);
        res = await ApiClient.applyOptimizations(formData);
      } else {
        res = await ApiClient.applyOptimizations({
          resumeText,
          acceptedProposalIds: selectedIds,
          editedProposals,
          proposals: optimizationPlan.proposals,
          jdText,
          targetRole: roleSearch || "Software Engineer",
          roleCategory,
          seniority,
          country,
          atsProfileKey,
          fileName: "Resume.txt"
        });
      }

      const reportData = res?.beforeAfterReport || res?.data;
      if (reportData) {
        setBeforeAfterReport(reportData);
        setOptimizedDocxBase64(res.optimizedDocxBase64);
        setReviewModalOpen(false);
        setStage("before_after");
      } else {
        setErrorMsg("Failed to generate before/after report.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to apply optimizations. Please try again.");
    } finally {
      setIsApplying(false);
    }
  };

  // Filtered issues
  const filteredIssues = (report?.issues || []).filter((issue) => {
    if (issueFilter === "all") return true;
    return issue.severity === issueFilter;
  });

  const criticalCount = (report?.issues || []).filter((i) => i.severity === "critical").length;
  const highCount = (report?.issues || []).filter((i) => i.severity === "high").length;
  const mediumCount = (report?.issues || []).filter((i) => i.severity === "medium").length;
  const lowCount = (report?.issues || []).filter((i) => i.severity === "low").length;

  const copySummary = () => {
    if (!report) return;
    const text = `ATS Score: ${report.overallScore}/100 (Grade ${report.grade} - ${report.gradeLabel})\nEstimated Pass Probability: ${report.passProbability}%\nResume Health: ${report.health}\nTarget Role: ${report.role}\n\nStrengths:\n${report.strengths.map(s => "• " + s).join("\n")}\n\nKey Recommendations:\n${report.issues.slice(0, 3).map(i => `• [${i.severity.toUpperCase()}] ${i.title}: ${i.suggestion}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const printReport = () => {
    window.print();
  };

  const downloadJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ATS_Report_${report.fileName.replace(/\.[^/.]+$/, "")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (workflowMode === "ats" && resumeId) {
    return <AtsDashboardWorkspace resumeId={resumeId} />;
  }

  if (workflowMode === "canonical" && resumeId) {
    return <CanonicalResumeWorkspace resumeId={resumeId} />;
  }



  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white">Resume Studio</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  ATS Checker
                </span>
              </div>
              <p className="text-xs text-slate-400">ATS Score Checker &amp; Issue Diagnostics</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {stage === "report" && (
              <button
                onClick={() => setStage("input")}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Check Another Resume
              </button>
            )}
            <Link
              to="/dashboard"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>
      {/* Distinct Workflow Mode Selector (Workflow A vs Workflow B) */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
        <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl flex flex-col sm:flex-row items-center gap-2 shadow-xl">
          <button
            onClick={() => setWorkflowMode("templates")}
            className={`flex-1 w-full flex items-center justify-center sm:justify-start gap-3 p-3 rounded-xl transition-all ${
              workflowMode === "templates"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 scale-[1.01]"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                workflowMode === "templates" ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">ATS Resume Templates</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-400/30">
                  NEW ATS DESIGN
                </span>
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">
                Select ATS template, extract &amp; review your content, and generate a new machine-readable design
              </p>
            </div>
          </button>

          <button
            onClick={() => setWorkflowMode("preservation")}
            className={`flex-1 w-full flex items-center justify-center sm:justify-start gap-3 p-3 rounded-xl transition-all ${
              workflowMode === "preservation"
                ? "bg-orange-600 text-white shadow-lg shadow-orange-600/25 scale-[1.01]"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                workflowMode === "preservation" ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">Format-Preserving ATS Optimizer</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                  PRESERVE FORMAT
                </span>
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">
                Analyze ATS score and optimize bullet points while preserving your original file layout &amp; design
              </p>
            </div>
          </button>
        </div>
      </div>

      {workflowMode === "templates" ? (
        <ResumeTemplateWorkspace resumeId={resumeId!} />
      ) : (
        <>
          {/* Main Container */}
          <main className="max-w-6xl mx-auto px-4 pt-4">
        {/* ================= STAGE 1: INPUT & UPLOAD ================= */}
        {stage === "input" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Hero / Instruction banner */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>100% Deterministic ATS Analysis</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Check Your Resume Against <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Real ATS Systems</span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Upload your resume, specify your target role, and get an instant, transparent ATS compatibility score with exact Before &amp; After fixes for every flagged issue.
              </p>
            </div>

            {errorMsg && (
              <div className="max-w-3xl mx-auto p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-3 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMsg}</div>
                <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-200">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Input Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: File / Text input & Optional JD (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* File Upload Box */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 rounded-full bg-orange-500 text-black font-bold text-xs items-center justify-center">1</span>
                      <h2 className="font-semibold text-white">Provide Your Resume</h2>
                    </div>

                    <div className="flex p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                      <button
                        onClick={() => setInputTab("file")}
                        className={`px-3 py-1 rounded-md font-medium transition ${
                          inputTab === "file" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Upload File
                      </button>
                      <button
                        onClick={() => setInputTab("text")}
                        className={`px-3 py-1 rounded-md font-medium transition ${
                          inputTab === "text" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Paste Text
                      </button>
                    </div>
                  </div>

                  {inputTab === "file" ? (
                    <div>
                      <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                          selectedFile
                            ? "border-emerald-500/50 bg-emerald-500/5"
                            : "border-slate-700 hover:border-orange-500/60 hover:bg-slate-800/40"
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.docx,.txt"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileSelected(e.target.files[0]);
                            }
                          }}
                        />

                        {selectedFile ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                              <FileText className="h-6 w-6" />
                            </div>
                            <span className="font-semibold text-white text-sm">{selectedFile.name}</span>
                            <span className="text-xs text-slate-400">
                              {(selectedFile.size / 1024).toFixed(1)} KB &middot; Click to select another file
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="h-12 w-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                              <Upload className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm">
                                Drag &amp; drop your resume here, or <span className="text-orange-400 underline">browse</span>
                              </p>
                              <p className="text-xs text-slate-400 mt-1">Supports PDF, DOCX, and TXT files</p>
                            </div>
                          </>
                        )}
                      </div>

                      {selectedFile && (
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                            }}
                            className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition"
                          >
                            <X className="h-3.5 w-3.5" /> Remove file
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <textarea
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="Paste your plain text resume here (including contact info, summary, experience, education, and skills)..."
                        rows={10}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition font-mono leading-relaxed"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-2">
                        <span>{resumeText.trim() ? (resumeText.match(/\S+/g) || []).length : 0} words</span>
                        <span>{resumeText.length} characters</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional Job Description Box */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <button
                    onClick={() => setShowJd(!showJd)}
                    className="w-full flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 rounded-full bg-slate-800 text-slate-300 font-bold text-xs items-center justify-center">2</span>
                      <div>
                        <h2 className="font-semibold text-white group-hover:text-orange-400 transition">
                          Target Job Description <span className="text-xs font-normal text-slate-400">(Optional)</span>
                        </h2>
                        <p className="text-xs text-slate-400">Paste job requirements for 1:1 keyword and competency match</p>
                      </div>
                    </div>
                    {showJd ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </button>

                  {showJd && (
                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
                      <textarea
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        placeholder="Paste the full job description or requirements here to check keyword alignment..."
                        rows={6}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition leading-relaxed"
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{jdText.trim() ? (jdText.match(/\S+/g) || []).length : 0} words</span>
                        <span>{jdText ? "Active 1:1 match" : "Using role skill list if left empty"}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Personalization & ATS Targeting (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 rounded-full bg-orange-500 text-black font-bold text-xs items-center justify-center">3</span>
                    <h2 className="font-semibold text-white">Targeting Settings</h2>
                  </div>

                  {/* Target Role Dropdown */}
                  <div className="space-y-2 relative" ref={roleSearchRef}>
                    <label className="text-xs font-medium text-slate-300">Target Role Title</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={roleSearch}
                        onChange={(e) => {
                          setRoleSearch(e.target.value);
                          setRoleDropdownOpen(true);
                        }}
                        onFocus={() => setRoleDropdownOpen(true)}
                        placeholder="Search 200+ roles (e.g. Frontend Developer)..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
                      />
                      <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                    </div>

                    {roleDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 p-2 space-y-2">
                        {categories.map((cat) => {
                          const matchingRoles = cat.roles.filter((r) =>
                            r.toLowerCase().includes(roleSearch.toLowerCase())
                          );
                          if (!matchingRoles.length && roleSearch.trim().length > 0) return null;
                          const displayRoles = matchingRoles.length ? matchingRoles : cat.roles.slice(0, 4);

                          return (
                            <div key={cat.id} className="space-y-1">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1 bg-slate-950/60 rounded">
                                {cat.name}
                              </div>
                              {displayRoles.map((r) => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => {
                                    setRoleSearch(r);
                                    setRoleCategory(cat.id);
                                    setRoleDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 text-xs text-slate-200 hover:bg-orange-500/20 hover:text-orange-300 rounded transition"
                                >
                                  {r}
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Seniority Level */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-300">Seniority Level</label>
                    <select
                      value={seniority}
                      onChange={(e) => setSeniority(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition"
                    >
                      {SENIORITIES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Country Convention */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-300">Country / Convention</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* ATS Engine Profile */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-300">ATS Engine Profile</label>
                    <select
                      value={atsProfileKey}
                      onChange={(e) => setAtsProfileKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition"
                    >
                      {ATS_PROFILES.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 leading-tight mt-1">
                      {ATS_PROFILES.find((p) => p.id === atsProfileKey)?.note}
                    </p>
                  </div>

                  {/* Analyze Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleAnalyze}
                      disabled={inputTab === "file" ? !selectedFile : resumeText.trim().length < 30}
                      className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 hover:from-orange-400 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2 group"
                    >
                      <Sparkles className="h-4 w-4 transition group-hover:rotate-12" />
                      Analyze My Resume
                    </button>
                    <p className="text-[11px] text-center text-slate-500 mt-2">
                      Zero fake metrics &middot; 100% explainable recruiter calculation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STAGE 2: LIVE SCANNING PROGRESS ================= */}
        {stage === "analyzing" && (
          <div className="max-w-xl mx-auto py-16 text-center space-y-8 animate-fadeIn">
            {/* Pulsing Spinner Icon */}
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-xl animate-pulse"></div>
              <div className="h-20 w-20 rounded-full bg-slate-900 border-2 border-orange-500 flex items-center justify-center relative">
                <RefreshCw className="h-8 w-8 text-orange-400 animate-spin" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white">Analyzing Your Resume...</h2>
              <p className="text-slate-400 text-sm">Evaluating document structure, action verbs, and keyword density</p>
            </div>

            {/* Sequential Steps Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-left space-y-3 shadow-xl">
              {SCAN_STEPS.map((step, idx) => {
                const isCompleted = idx < scanStepIndex;
                const isCurrent = idx === scanStepIndex;

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 text-xs transition-all duration-300 ${
                      isCompleted
                        ? "text-emerald-400 font-medium"
                        : isCurrent
                        ? "text-orange-400 font-semibold scale-102"
                        : "text-slate-500"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <div className="h-4 w-4 rounded-full border-2 border-orange-400 border-t-transparent animate-spin shrink-0"></div>
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-slate-700 shrink-0"></div>
                    )}
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= STAGE 3: FULL ATS REPORT ================= */}
        {stage === "report" && report && (
          <div className="space-y-8 animate-fadeIn">
            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-3 text-sm animate-fadeIn">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMsg}</div>
                <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-200">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Report Actions Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
              <div>
                <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">ATS Audit Report</span>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>{report.fileName}</span>
                  <span className="text-xs font-normal text-slate-400">({report.wordCount} words)</span>
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowRawTextModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" /> What ATS Sees
                </button>
                <button
                  onClick={copySummary}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
                >
                  {copiedSummary ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedSummary ? "Copied!" : "Copy Summary"}
                </button>
                <button
                  onClick={downloadJSON}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> JSON
                </button>
                <button
                  onClick={printReport}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" /> Print / PDF
                </button>
                <button
                  onClick={handleGeneratePlan}
                  disabled={isOptimizing}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 transition flex items-center gap-1.5 shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isOptimizing ? (
                    <>
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                      <span>Optimizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Generate Updated Resume</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setStage("input")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> New Analysis
                </button>
              </div>
            </div>

            {/* Format-Preserving AI Optimization CTA Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-slate-900 border border-orange-500/30 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
              <div className="space-y-2 z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Format-Preserving AI Optimization Engine</span>
                </div>
                <h3 className="text-xl font-black text-white">
                  Fix ATS Weaknesses Without Altering Your Original Formatting
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Unlike tools that destroy your template or fabricate facts, INTERVIEW AI targets weak bullets in your <strong>original document artifact</strong> in place.
                  Your exact fonts, margins, company names, and dates remain 100% untouched.
                </p>

                {selectedFile && !selectedFile.name.toLowerCase().endsWith(".docx") && (
                  <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 mt-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Upload a DOCX file for 100% native run-level OOXML preservation. PDF improvements will be applied and exported.</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleGeneratePlan}
                disabled={isOptimizing}
                className="px-6 py-3.5 rounded-2xl text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 transition flex items-center gap-2.5 shadow-xl shadow-orange-500/25 shrink-0 z-10 disabled:opacity-50"
              >
                {isOptimizing ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    <span>Analyzing ATS Issues &amp; Grounding...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Grounded Improvements</span>
                  </>
                )}
              </button>
            </div>

            {/* Executive Score Card */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Score Gauge (4 cols) */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
                  <div className="relative flex items-center justify-center h-44 w-44">
                    {/* Background Circle */}
                    <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        className="stroke-slate-800"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        style={{
                          stroke: report.gradeColor,
                          strokeDasharray: 264,
                          strokeDashoffset: 264 - (264 * report.overallScore) / 100,
                          transition: "stroke-dashoffset 1s ease-out"
                        }}
                        strokeWidth="8"
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-4xl font-extrabold text-white tracking-tight">{report.overallScore}</span>
                      <span className="text-xs font-medium text-slate-400">out of 100</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold text-white shadow"
                      style={{ backgroundColor: report.gradeColor }}
                    >
                      Grade {report.grade} &middot; {report.gradeLabel}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        report.health === "Green"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : report.health === "Yellow"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      Health: {report.health}
                    </span>
                  </div>
                </div>

                {/* Recruiter Assessment & Probabilities (8 cols) */}
                <div className="lg:col-span-8 space-y-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-medium">
                      Target: {report.role}
                    </span>
                    {report.seniority && (
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-medium">
                        Level: {report.seniority}
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-medium">
                      Profile: {report.atsProfile}
                    </span>
                    {report.country && (
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-medium">
                        Convention: {report.country}
                      </span>
                    )}
                  </div>

                  {/* Pass Probability Tile */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-black text-lg shrink-0">
                      {report.passProbability}%
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Estimated ATS Pass Probability
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Calculated transparently: <strong>60% overall score + 40% keyword match</strong>. Gives a realistic prediction of passing automated keyword gating.
                      </p>
                    </div>
                  </div>

                  {/* Recruiter Executive Summary */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <Briefcase className="h-4 w-4 text-orange-400" />
                      <span>Recruiter Assessment</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {report.recruiterSummary}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 8-Category Breakdown Grid */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">8-Category ATS Breakdown</h3>
                <p className="text-xs text-slate-400">
                  Every category has a transparent weighted contribution with zero hidden formulas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {report.sectionWeights.map((sw) => {
                  const labels: Record<string, string> = {
                    keywordMatch: "Keyword Match",
                    structure: "Section Structure",
                    formatting: "Formatting & Layout",
                    writingQuality: "Writing Quality",
                    achievements: "Quantified Impact",
                    experience: "Work History",
                    education: "Education & Degree",
                    contact: "Contact Information"
                  };

                  return (
                    <div key={sw.category} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">{labels[sw.category] || sw.category}</span>
                        <span className="text-xs font-bold text-white">{sw.score}/100</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${sw.score}%`,
                            backgroundColor: sw.score >= 80 ? "#10b981" : sw.score >= 60 ? "#f59e0b" : "#ef4444"
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Weight: {sw.weight}%</span>
                        <span>Pts: +{sw.contribution}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strengths & Roadmap Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Strengths Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-base">Key Resume Strengths</h3>
                </div>
                <div className="space-y-2.5">
                  {report.strengths.map((str, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <span className="flex h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-400 items-center justify-center shrink-0 mt-0.5">✓</span>
                      <span className="leading-relaxed">{str}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvement Roadmap Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-400" />
                    <h3 className="font-bold text-white text-base">Score Improvement Roadmap</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    +{report.roadmap.potentialGain} Pts Potential
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Targeting your top deficiencies will generate the fastest score increases:
                </p>
                <div className="space-y-2.5">
                  {report.roadmap.items.map((item, idx) => {
                    const catTitles: Record<string, string> = {
                      keywordMatch: "Keyword Coverage",
                      structure: "Section Headers",
                      formatting: "Formatting Cleanliness",
                      writingQuality: "Active Voice & Verbs",
                      achievements: "Quantified Metrics",
                      experience: "Employment Chronology",
                      education: "Degree Details",
                      contact: "Contact Credentials"
                    };

                    return (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-mono font-bold">#{idx + 1}</span>
                          <span className="font-semibold text-slate-200">{catTitles[item.cat] || item.cat}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">Current: {item.score}%</span>
                          <span className="text-emerald-400 font-semibold">Deficiency: -{Math.round(item.deficiency)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Keyword Match Panel */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Keyword &amp; Competency Intelligence</h3>
                  <p className="text-xs text-slate-400">
                    {report.keywordRes.usedJD ? "Matched against provided Job Description" : "Matched against expected skills for " + report.role}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Match Rate:</span>
                  <span className="text-sm font-bold text-emerald-400">{report.keywordRes.matchPct}%</span>
                </div>
              </div>

              {/* Matched & Missing Chips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Matched Keywords */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Matched Keywords ({report.keywordRes.matched.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {report.keywordRes.matched.length > 0 ? (
                      report.keywordRes.matched.map((kw, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-md text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                          {kw}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">No keyword matches found yet.</span>
                    )}
                  </div>
                </div>

                {/* Missing Keywords */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Missing Target Keywords ({report.keywordRes.missing.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {report.keywordRes.missing.length > 0 ? (
                      report.keywordRes.missing.map((kw, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-md text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                          +{kw}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-emerald-400">All required keywords are present!</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Detected Tech Stack & Certs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {report.keywordRes.techFound.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                    <span className="text-slate-400 font-semibold block mb-1.5">Detected Technical Tools:</span>
                    <div className="flex flex-wrap gap-1">
                      {report.keywordRes.techFound.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {report.keywordRes.certsFound.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                    <span className="text-slate-400 font-semibold block mb-1.5">Detected Certifications:</span>
                    <div className="flex flex-wrap gap-1">
                      {report.keywordRes.certsFound.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Flagged Issues & Priority Fixes (PRIMARY FEATURE) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Priority Fixes &amp; Flagged Issues</h3>
                  <p className="text-xs text-slate-400">
                    Fixing these issues will eliminate automatic rejections and maximize recruiter review conversion.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs gap-1">
                  <button
                    onClick={() => setIssueFilter("all")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      issueFilter === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    All ({report.issues.length})
                  </button>
                  <button
                    onClick={() => setIssueFilter("critical")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      issueFilter === "critical" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Critical ({criticalCount})
                  </button>
                  <button
                    onClick={() => setIssueFilter("high")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      issueFilter === "high" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    High ({highCount})
                  </button>
                  <button
                    onClick={() => setIssueFilter("medium")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      issueFilter === "medium" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Medium ({mediumCount})
                  </button>
                  <button
                    onClick={() => setIssueFilter("low")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      issueFilter === "low" ? "bg-slate-800 text-slate-300" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Low ({lowCount})
                  </button>
                </div>
              </div>

              {/* Issue Cards */}
              <div className="space-y-4">
                {filteredIssues.length > 0 ? (
                  filteredIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition space-y-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {issue.id && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-orange-400 border border-slate-700">
                                {issue.id}
                              </span>
                            )}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                issue.severity === "critical"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : issue.severity === "high"
                                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                  : issue.severity === "medium"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-slate-800 text-slate-400 border border-slate-700"
                              }`}
                            >
                              {issue.severity}
                            </span>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                              {issue.category}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white">{issue.title}</h4>
                        </div>

                        <span className="text-[11px] text-slate-500">{issue.confidence}</span>
                      </div>

                      {/* Why it matters & Location */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-900/50 p-3 rounded-xl border border-slate-900">
                        <div>
                          <span className="font-semibold text-slate-400 block mb-0.5">Why it matters:</span>
                          <p className="text-slate-300 leading-relaxed">{issue.why}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-400 block mb-0.5">Where detected:</span>
                          <p className="text-slate-300 leading-relaxed font-mono">{issue.where}</p>
                        </div>
                      </div>

                      {/* Actionable Fix Suggestion */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-400">
                          <ArrowRight className="h-3.5 w-3.5" />
                          <span>Recommended Action:</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed pl-5">
                          {issue.suggestion}
                        </p>
                      </div>

                      {/* Before & After Rewrite Example (if provided) */}
                      {issue.beforeExample && issue.afterExample && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                          <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block">
                              Before (Flags ATS)
                            </span>
                            <p className="text-xs text-slate-300 italic font-mono">
                              "{issue.beforeExample}"
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                              After (ATS Optimized)
                            </span>
                            <p className="text-xs text-slate-200 font-medium font-mono">
                              "{issue.afterExample}"
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No issues found under the "{issueFilter}" severity level.
                  </div>
                )}
              </div>

              {/* Bottom Generate Improvements CTA */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-slate-950 border border-orange-500/20">
                <div>
                  <h4 className="text-sm font-bold text-white">Ready to fix these issues and update your resume?</h4>
                  <p className="text-xs text-slate-400">Our AI will generate tailored replacements preserving your original formatting.</p>
                </div>
                <button
                  id="fix-issues-generate-btn"
                  onClick={handleGeneratePlan}
                  disabled={isOptimizing}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 transition flex items-center gap-2 shadow-lg shadow-orange-500/20 shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  {isOptimizing ? (
                    <>
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                      <span>Generating Grounded Optimizations...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Fix Issues &amp; Generate Updated Resume</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STAGE 4: BEFORE & AFTER ATS DELTA REPORT ================= */}
        {stage === "before_after" && beforeAfterReport && (
          <BeforeAfterReport
            report={beforeAfterReport}
            onNewScan={() => setStage("input")}
            optimizedDocxBase64={optimizedDocxBase64}
          />
        )}
      </main>

      {/* Format-Preserving Optimization Review Modal */}
      {optimizationPlan && (
        <OptimizationReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          proposals={optimizationPlan.proposals}
          onApply={handleApplyOptimizations}
          isApplying={isApplying}
          fileName={selectedFile?.name || "Uploaded Resume"}
          isDocx={Boolean(selectedFile?.name.toLowerCase().endsWith(".docx"))}
        />
      )}

      {/* Raw Extracted Text Modal ("What ATS Sees") */}
      {showRawTextModal && report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">What the ATS Extracted</h3>
                <p className="text-xs text-slate-400">
                  This is the exact plain text machine parsers extract from your resume. Check for scrambled words or missing lines.
                </p>
              </div>
              <button
                onClick={() => setShowRawTextModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-950 flex-1">
              {report.resumeTextPreview || "No raw text available."}
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowRawTextModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
