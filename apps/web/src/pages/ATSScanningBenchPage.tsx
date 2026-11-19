import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanLine, CheckCircle2, AlertTriangle, XCircle, FileText, ArrowRight,
  ShieldCheck, RefreshCw, Upload, Eye, EyeOff, Zap, Check, AlertCircle,
  Download, History, SlidersHorizontal, Sparkles, Clock, ChevronDown,
  ChevronUp, Copy, ExternalLink, Briefcase, GraduationCap, Mail, Phone,
  Globe, TrendingUp, X, Filter, BarChart3, HelpCircle
} from "lucide-react";
import {
  ApiClient,
  IResumeAnalysis,
  IATSIssueItem,
  IAtsCategoryScoreDetail,
} from "../lib/api";
import { MechanicalButton } from "../components/ui/MechanicalButton";
import { InkBleedButton } from "../components/ui/InkBleedButton";
import { MorphingActionPill } from "../components/ui/MorphingActionPill";

type ScanStage = "IDLE" | "EXTRACTING" | "PARSING" | "EVALUATING" | "SEMANTIC_AI" | "COMPLETE";

export default function ATSScanningBenchPage() {
  // Navigation & Modes
  const [scanMode, setScanMode] = useState<"GENERAL" | "JOB_SPECIFIC">("GENERAL");
  const [jobDescriptionInput, setJobDescriptionInput] = useState("");
  const [targetRoleInput, setTargetRoleInput] = useState("");

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis Lifecycle
  const [stage, setStage] = useState<ScanStage>("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<IResumeAnalysis | null>(null);
  const [historyList, setHistoryList] = useState<Array<Partial<IResumeAnalysis>>>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Filter Issues
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Improvement Drawer
  const [showImproveModal, setShowImproveModal] = useState(false);
  const [improvements, setImprovements] = useState<any[]>([]);
  const [loadingImprovements, setLoadingImprovements] = useState(false);
  const [acceptedImprovements, setAcceptedImprovements] = useState<Record<string, boolean>>({});

  // Active platform jobs for Job-Specific mode selection
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");

  useEffect(() => {
    loadHistory();
    loadJobs();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await ApiClient.getAtsHistory();
      if (res?.success && Array.isArray(res.history)) {
        setHistoryList(res.history);
        // If no active analysis and history exists, load the latest
        if (!currentAnalysis && res.history.length > 0 && res.history[0]._id) {
          const latest = await ApiClient.getAtsAnalysis(res.history[0]._id);
          if (latest?.success) {
            setCurrentAnalysis(latest.analysis);
          }
        }
      }
    } catch (err) {
      console.warn("Could not load ATS scan history:", err);
    }
  };

  const loadJobs = async () => {
    try {
      const res = await ApiClient.getJobs({ limit: 10 });
      if (res?.jobs && Array.isArray(res.jobs)) {
        setAvailableJobs(res.jobs);
      }
    } catch (err) {
      console.warn("Could not load jobs for ATS selection:", err);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelected(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelected(files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "doc", "txt"].includes(ext || "")) {
      setErrorMessage("Please select a standard PDF or DOCX resume document.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File exceeds the 10MB maximum limit.");
      return;
    }
    setErrorMessage(null);
    setSelectedFile(file);
  };

  // Execute End-to-End Scan
  const handleStartAnalysis = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select or upload a resume file first.");
      return;
    }

    setErrorMessage(null);
    setStage("EXTRACTING");

    try {
      // 1. Upload & Extract Text
      const formData = new FormData();
      formData.append("file", selectedFile);

      setStage("EXTRACTING");
      const uploadRes = await ApiClient.uploadAtsResume(formData);

      if (!uploadRes.success) {
        throw new Error(uploadRes.warnings?.[0] || "Failed to extract text from document.");
      }

      setStage("PARSING");
      await new Promise((r) => setTimeout(r, 400));

      setStage("EVALUATING");
      await new Promise((r) => setTimeout(r, 400));

      setStage("SEMANTIC_AI");

      // 2. Perform Full 7-Category Evaluation
      const analyzeRes = await ApiClient.analyzeAts({
        fileName: uploadRes.fileName,
        fileSize: uploadRes.fileSize,
        fileType: uploadRes.fileType,
        text: uploadRes.text,
        profileData: uploadRes.profileData,
        mode: scanMode,
        targetRole: targetRoleInput || undefined,
        jobId: selectedJobId || undefined,
        jdText: jobDescriptionInput || undefined,
        previousAnalysisId: currentAnalysis?._id || undefined,
      });

      if (!analyzeRes.success) {
        throw new Error("Evaluation could not be finalized.");
      }

      setStage("COMPLETE");
      setCurrentAnalysis(analyzeRes.analysis);
      loadHistory();
    } catch (err: any) {
      console.error("[ATS Scan Failed]", err);
      setStage("IDLE");
      setErrorMessage(err.message || "An unexpected error occurred during resume evaluation.");
    }
  };

  // Load Past Analysis
  const handleSelectHistoryReport = async (id: string) => {
    try {
      setStage("IDLE");
      const res = await ApiClient.getAtsAnalysis(id);
      if (res?.success) {
        setCurrentAnalysis(res.analysis);
        setShowHistoryModal(false);
      }
    } catch (err: any) {
      setErrorMessage("Failed to load historical report.");
    }
  };

  // Download Report
  const handleDownloadReport = async () => {
    if (!currentAnalysis) return;
    try {
      const blob = await ApiClient.downloadAtsReport(currentAnalysis._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ATS_Audit_Report_${currentAnalysis.fileName.replace(/\.[^/.]+$/, "")}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Report download failed:", err);
    }
  };

  // Open Improvements
  const handleOpenImprovements = async () => {
    if (!currentAnalysis) return;
    setShowImproveModal(true);
    setLoadingImprovements(true);
    try {
      const res = await ApiClient.getAtsImprovements(currentAnalysis._id);
      if (res?.success) {
        setImprovements(res.improvements || []);
      }
    } catch (err) {
      console.error("Could not fetch improvements:", err);
    } finally {
      setLoadingImprovements(false);
    }
  };

  // Filter Issues
  const filteredIssues = (currentAnalysis?.issues || []).filter((iss) => {
    if (severityFilter !== "ALL" && iss.severity !== severityFilter) return false;
    if (categoryFilter !== "ALL" && iss.category !== categoryFilter) return false;
    return true;
  });

  // Score Band Color
  const getScoreBandStyle = (band: string) => {
    switch (band) {
      case "Excellent":
      case "Very Good":
        return { text: "text-[#2E6347]", bg: "bg-[#EBF3EE]", border: "border-[#D0E3D6]" };
      case "Good":
        return { text: "text-[#172535]", bg: "bg-[#EAEFF5]", border: "border-[#D5DEE8]" };
      case "Needs Improvement":
        return { text: "text-[#A36114]", bg: "bg-[#FDF6E9]", border: "border-[#A36114]/20" };
      default:
        return { text: "text-[#9E2A2B]", bg: "bg-[#FCEEEE]", border: "border-[#9E2A2B]/20" };
    }
  };

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-[#FCEEEE] text-[#9E2A2B] border-[#F7D0D0]";
      case "HIGH":
        return "bg-[#FDF6E9] text-[#A36114] border-[#F7E6C4]";
      case "MEDIUM":
        return "bg-[#FFF9EB] text-[#8C6D1F] border-[#EADBB6]";
      default:
        return "bg-[#F5F3EE] text-[#5C564E] border-[#E5E0D4]";
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#181614] flex flex-col font-sans">
      {/* ── Bench Navigation Header ── */}
      <header className="border-b border-[#E5E0D4] bg-white px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#172535] bg-[#EFECE6] px-2 py-0.5 rounded border border-[#DCD5C6]">
                ATS RESUME SCANNER v3.0
              </span>
              <span className="text-xs font-mono text-[#8C8479]">
                DETERMINISTIC EVALUATION & SEMANTIC AUDIT
              </span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#181614] tracking-tight mt-1">
              ATS Resume Scanner & Compliance Bench
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="px-3 py-1.5 rounded-md text-xs font-mono font-medium text-[#181614] bg-white border border-[#E5E0D4] hover:bg-[#FAF8F5] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <History className="w-3.5 h-3.5 text-[#C84B26]" />
              <span>Past Reports ({historyList.length})</span>
            </button>

            {currentAnalysis && (
              <MechanicalButton
                variant="stone"
                size="sm"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={handleDownloadReport}
              >
                Download Audit Report
              </MechanicalButton>
            )}

            {currentAnalysis && (
              <MechanicalButton
                variant="vermilion"
                size="sm"
                icon={<Sparkles className="w-3.5 h-3.5" />}
                onClick={handleOpenImprovements}
              >
                Improve Resume
              </MechanicalButton>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Work Area ── */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 space-y-8">
        {/* ── Upload & Configuration Shelf ── */}
        <div className="bg-white rounded-lg border border-[#E5E0D4] p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E0D4] pb-4">
            <div>
              <h2 className="text-base font-serif font-bold text-[#181614]">
                Upload Candidate Resume
              </h2>
              <p className="text-xs text-[#8C8479] mt-0.5">
                Support for PDF and DOCX documents up to 10MB. Real text extraction and measurable compliance parsing.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center p-1 bg-[#F5F3EE] rounded-lg border border-[#E5E0D4] self-start sm:self-center">
              <button
                onClick={() => setScanMode("GENERAL")}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                  scanMode === "GENERAL"
                    ? "bg-white text-[#172535] shadow-xs"
                    : "text-[#8C8479] hover:text-[#181614]"
                }`}
              >
                General Resume Scan
              </button>
              <button
                onClick={() => setScanMode("JOB_SPECIFIC")}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                  scanMode === "JOB_SPECIFIC"
                    ? "bg-white text-[#C84B26] shadow-xs"
                    : "text-[#8C8479] hover:text-[#181614]"
                }`}
              >
                Job-Specific Match
              </button>
            </div>
          </div>

          {/* Job Specific JD Picker / Paste Box */}
          {scanMode === "JOB_SPECIFIC" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-[#FAF8F5] border border-[#E5E0D4] rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#C84B26] flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  Target Requisition Specifications
                </span>
                <span className="text-[10px] font-mono text-[#8C8479]">
                  Exact keyword & requirement comparator
                </span>
              </div>

              {availableJobs.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[11px] font-mono text-[#5C564E]">Or select from platform board:</span>
                  <select
                    value={selectedJobId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedJobId(id);
                      const found = availableJobs.find((j) => j.id === id);
                      if (found) {
                        setJobDescriptionInput(found.description || "");
                        setTargetRoleInput(found.title || "");
                      }
                    }}
                    className="p-1.5 bg-white border border-[#E5E0D4] rounded text-xs text-[#181614] font-sans"
                  >
                    <option value="">-- Choose active job listing --</option>
                    {availableJobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} @ {j.company_name || "Company"} ({j.location || "Remote"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[#8C8479] uppercase block mb-1">
                    Target Role Title
                  </label>
                  <input
                    type="text"
                    value={targetRoleInput}
                    onChange={(e) => setTargetRoleInput(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full p-2 bg-white border border-[#E5E0D4] rounded text-xs text-[#181614]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-mono text-[#8C8479] uppercase block mb-1">
                    Job Description Requisition Text
                  </label>
                  <textarea
                    rows={2}
                    value={jobDescriptionInput}
                    onChange={(e) => setJobDescriptionInput(e.target.value)}
                    placeholder="Paste the target job description requirements, responsibilities, or technical stack..."
                    className="w-full p-2 bg-white border border-[#E5E0D4] rounded text-xs text-[#181614] resize-y"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Drag & Drop Upload Container */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-[#C84B26] bg-[#FAF8F5]"
                : selectedFile
                ? "border-[#2E6347] bg-[#EBF3EE]/40"
                : "border-[#DCD5C6] hover:border-[#172535] bg-[#FAF8F5]/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-xl mx-auto p-4 bg-white border border-[#D0E3D6] rounded-md shadow-xs">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded bg-[#EBF3EE] border border-[#D0E3D6] flex items-center justify-center text-[#2E6347] shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-[#181614] truncate max-w-xs sm:max-w-md">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] font-mono text-[#8C8479]">
                      {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.name.split(".").pop()?.toUpperCase()} Document
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-2.5 py-1 text-[11px] font-mono text-[#181614] bg-[#F5F3EE] hover:bg-[#E5E0D4] rounded transition-colors"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="p-1 text-[#9E2A2B] hover:bg-[#FCEEEE] rounded transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-white border border-[#E5E0D4] flex items-center justify-center mx-auto text-[#C84B26] shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#181614]">
                    Drag and drop your resume here, or{" "}
                    <span className="text-[#C84B26] hover:underline">browse files</span>
                  </p>
                  <p className="text-[11px] font-mono text-[#8C8479] mt-1">
                    Accepts native text PDF or Word DOCX (up to 10MB).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 bg-[#FCEEEE] border border-[#F7D0D0] rounded-md text-[#9E2A2B] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="text-xs text-[#8C8479] font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2E6347]" />
              <span>Scored deterministically using 7 empirical ATS benchmarks. Zero random scores.</span>
            </div>

            <MechanicalButton
              variant="vermilion"
              size="md"
              disabled={!selectedFile || stage !== "IDLE" && stage !== "COMPLETE"}
              onClick={handleStartAnalysis}
              icon={
                stage !== "IDLE" && stage !== "COMPLETE" ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ScanLine className="w-4 h-4" />
                )
              }
            >
              {stage !== "IDLE" && stage !== "COMPLETE" ? "Analyzing Document..." : "Analyze Resume"}
            </MechanicalButton>
          </div>
        </div>

        {/* ── Processing Stage Progress Bar ── */}
        {stage !== "IDLE" && stage !== "COMPLETE" && (
          <div className="bg-white rounded-lg border border-[#E5E0D4] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[#181614] flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#C84B26] animate-spin" />
                DOCUMENT PROCESSING IN PROGRESS
              </span>
              <span className="text-[#8C8479]">MEASURABLE EVALUATION PIPELINE</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
              {[
                { key: "EXTRACTING", label: "1. Text Extraction", desc: "Native PDF/DOCX stream" },
                { key: "PARSING", label: "2. Entity Detection", desc: "Contact, skills, bullets" },
                { key: "EVALUATING", label: "3. ATS Rubric Check", desc: "7 weighted categories" },
                { key: "SEMANTIC_AI", label: "4. Semantic AI Audit", desc: "Clarity & achievements" },
              ].map((step, idx) => {
                const isActive = stage === step.key;
                const isPast =
                  (stage === "PARSING" && idx < 1) ||
                  (stage === "EVALUATING" && idx < 2) ||
                  (stage === "SEMANTIC_AI" && idx < 3);

                return (
                  <div
                    key={step.key}
                    className={`p-3 rounded border text-xs transition-all ${
                      isActive
                        ? "bg-[#FAF8F5] border-[#C84B26] shadow-xs"
                        : isPast
                        ? "bg-[#EBF3EE] border-[#D0E3D6]"
                        : "bg-white border-[#E5E0D4] opacity-50"
                    }`}
                  >
                    <div className="font-mono font-bold flex items-center justify-between text-[11px]">
                      <span>{step.label}</span>
                      {isPast ? (
                        <Check className="w-3.5 h-3.5 text-[#2E6347]" />
                      ) : isActive ? (
                        <span className="w-2 h-2 rounded-full bg-[#C84B26] animate-pulse" />
                      ) : null}
                    </div>
                    <p className="text-[10px] text-[#8C8479] mt-0.5">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Active ATS Analysis Report ── */}
        {currentAnalysis && stage !== "EXTRACTING" && stage !== "PARSING" && stage !== "EVALUATING" && stage !== "SEMANTIC_AI" && (
          <div className="space-y-8">
            {/* ── Section A: Top Composite Score Readout ── */}
            <div className="bg-white rounded-lg border border-[#E5E0D4] p-6 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Score Dial & Classification (Cols 1-4) */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-6 bg-[#FAF8F5] border border-[#E5E0D4] rounded-lg">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    {/* Radial SVG Gauge */}
                    <svg className="w-36 h-36 transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        stroke="#E5E0D4"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        stroke={currentAnalysis.overallScore >= 75 ? "#2E6347" : currentAnalysis.overallScore >= 60 ? "#C84B26" : "#9E2A2B"}
                        strokeWidth="10"
                        strokeDasharray={377}
                        strokeDashoffset={377 - (377 * currentAnalysis.overallScore) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>

                    <div className="absolute flex flex-col items-center">
                      <span className="text-4xl font-serif font-bold text-[#181614] tracking-tight">
                        {currentAnalysis.overallScore}
                      </span>
                      <span className="text-[10px] font-mono text-[#8C8479]">OUT OF 100</span>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                        getScoreBandStyle(currentAnalysis.scoreBand).bg
                      } ${getScoreBandStyle(currentAnalysis.scoreBand).text} ${
                        getScoreBandStyle(currentAnalysis.scoreBand).border
                      }`}
                    >
                      {currentAnalysis.scoreBand.toUpperCase()} RESUME
                    </span>
                    <p className="text-[10px] font-mono text-[#8C8479]">
                      Target: {currentAnalysis.targetRole}
                    </p>
                  </div>
                </div>

                {/* Score Meta & Disclaimers (Cols 5-12) */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E0D4] pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-serif text-[#181614]">
                          {currentAnalysis.fileName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#F5F3EE] border border-[#E5E0D4] text-[#5C564E]">
                          {currentAnalysis.analysisMode} SCAN
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-[#8C8479]">
                        Evaluated {new Date(currentAnalysis.createdAt).toLocaleDateString()} at{" "}
                        {new Date(currentAnalysis.createdAt).toLocaleTimeString()} • Rubric v{currentAnalysis.scoringVersion}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownloadReport}
                        className="px-2.5 py-1.5 rounded bg-white border border-[#E5E0D4] text-xs font-mono text-[#181614] hover:bg-[#FAF8F5] flex items-center gap-1 shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-[#C84B26]" />
                        <span>Export Summary</span>
                      </button>
                    </div>
                  </div>

                  {/* Feature 5: Before vs After ATS Score Comparison */}
                  {currentAnalysis.beforeScore != null && (
                    <div className="p-4 bg-[#EBF3EE] border border-[#D0E3D6] rounded-lg flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white border border-[#D0E3D6] flex items-center justify-center text-[#2E6347]">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#181614] flex items-center gap-2">
                            <span>Before vs. After Improvement Score</span>
                            <span className="px-2 py-0.2 rounded bg-[#2E6347] text-white font-mono text-[10px]">
                              +{currentAnalysis.afterScore! - currentAnalysis.beforeScore!} POINTS EARNED
                            </span>
                          </div>
                          <p className="text-[11px] text-[#2E6347] mt-0.5">
                            Initial Upload: <span className="font-bold">{currentAnalysis.beforeScore}/100</span> → Optimized Version: <span className="font-bold">{currentAnalysis.afterScore}/100</span>
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold text-[#2E6347]">
                        VERIFIED RE-SCAN
                      </span>
                    </div>
                  )}

                  <p className="text-xs text-[#5C564E] leading-relaxed">
                    This score is calculated by executing measurable rules across 7 weighted ATS dimensions. It inspects your raw extractable text layer, section layout hierarchy, technical keyword footprints, and quantitative project impact without arbitrary LLM guessing.
                  </p>

                  <div className="p-3 bg-[#FAF8F5] rounded border border-[#E5E0D4] flex items-start gap-2.5 text-[11px] text-[#8C8479] font-mono">
                    <HelpCircle className="w-4 h-4 text-[#C84B26] shrink-0 mt-0.5" />
                    <span>
                      Notice: ATS scores are diagnostic benchmarks calibrated to enterprise parsing standards (Taleo, Workday, Greenhouse). There is no single universal algorithm across all employers.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section B: 7 Category-Wise Score Cards ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-base text-[#181614]">
                  7-Dimension Category Breakdown (100 Points Total)
                </h3>
                <span className="text-[11px] font-mono text-[#8C8479]">
                  Click any category to filter redlines below
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { key: "keywordsSkills", label: "Keywords & Skills", max: 25, data: currentAnalysis.categoryScores.keywordsSkills },
                  { key: "resumeStructure", label: "Resume Structure", max: 15, data: currentAnalysis.categoryScores.resumeStructure },
                  { key: "experienceProjects", label: "Experience & Projects", max: 15, data: currentAnalysis.categoryScores.experienceProjects },
                  { key: "formattingReadability", label: "ATS Readability", max: 15, data: currentAnalysis.categoryScores.formattingReadability },
                  { key: "educationCertifications", label: "Education & Certs", max: 10, data: currentAnalysis.categoryScores.educationCertifications },
                  { key: "contactInfo", label: "Contact Details", max: 10, data: currentAnalysis.categoryScores.contactInfo },
                  { key: "grammarClarity", label: "Grammar & Clarity", max: 10, data: currentAnalysis.categoryScores.grammarClarity },
                ].map((item) => {
                  const isSelected = categoryFilter === item.key;
                  const pct = item.data.percentage;
                  const barColor = pct >= 80 ? "bg-[#2E6347]" : pct >= 60 ? "bg-[#C84B26]" : "bg-[#9E2A2B]";

                  return (
                    <div
                      key={item.key}
                      onClick={() => setCategoryFilter(isSelected ? "ALL" : item.key)}
                      className={`p-4 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-white border-[#C84B26] shadow-sm ring-1 ring-[#C84B26]"
                          : "bg-white border-[#E5E0D4] hover:border-[#DCD5C6] shadow-2xs"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-serif font-bold text-xs text-[#181614] leading-snug">
                            {item.label}
                          </span>
                          <span className="font-mono text-xs font-bold text-[#181614] shrink-0">
                            {item.data.score}/{item.max}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-[#F5F3EE] rounded-full overflow-hidden border border-[#E5E0D4]">
                          <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>

                        <p className="text-[11px] text-[#8C8479] leading-relaxed line-clamp-2">
                          {item.data.summary}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#F5F3EE] mt-3 text-[10px] font-mono text-[#8C8479]">
                        <span>{pct}% EFFICIENCY</span>
                        <span className={item.data.issuesCount > 0 ? "text-[#C84B26] font-bold" : "text-[#2E6347]"}>
                          {item.data.issuesCount} {item.data.issuesCount === 1 ? "issue" : "issues"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Section C: Strengths & Keyword Intelligence ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Strengths Card */}
              <div className="bg-white rounded-lg border border-[#E5E0D4] p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E0D4] pb-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2E6347]" />
                    <h4 className="font-serif font-bold text-sm text-[#181614]">
                      Verified Resume Strengths ({currentAnalysis.strengths.length})
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-[#2E6347] bg-[#EBF3EE] px-2 py-0.5 rounded font-bold">
                    PASSING CRITERIA
                  </span>
                </div>

                <ul className="space-y-2">
                  {currentAnalysis.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-[#181614]">
                      <span className="w-4 h-4 rounded-full bg-[#EBF3EE] text-[#2E6347] flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                        ✓
                      </span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Keyword Intelligence Card */}
              <div className="bg-white rounded-lg border border-[#E5E0D4] p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E0D4] pb-2.5">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#C84B26]" />
                    <h4 className="font-serif font-bold text-sm text-[#181614]">
                      Keyword Intelligence: {currentAnalysis.targetRole}
                    </h4>
                  </div>
                  {currentAnalysis.keywordAnalysis.jdMatchScore != null && (
                    <span className="text-[10px] font-mono text-[#C84B26] bg-[#FAF8F5] px-2 py-0.5 rounded font-bold border border-[#E5E0D4]">
                      JD MATCH: {currentAnalysis.keywordAnalysis.jdMatchScore}%
                    </span>
                  )}
                </div>

                {/* Matched Keywords */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#2E6347] font-bold">
                    ✓ Matched Keywords ({currentAnalysis.keywordAnalysis.matchedKeywords.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentAnalysis.keywordAnalysis.matchedKeywords.slice(0, 15).map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#EBF3EE] text-[#2E6347] border border-[#D0E3D6]"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Keywords */}
                {currentAnalysis.keywordAnalysis.missingKeywords.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-[#F5F3EE]">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#A36114] font-bold">
                      ⚠ Missing Keywords / Recommended Additions ({currentAnalysis.keywordAnalysis.missingKeywords.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {currentAnalysis.keywordAnalysis.missingKeywords.slice(0, 12).map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#FDF6E9] text-[#A36114] border border-[#A36114]/20"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Section D: Critical Issues & Redline Adjustments ── */}
            <div className="bg-white rounded-lg border border-[#E5E0D4] p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E0D4] pb-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#181614]">
                    Detected Compliance Issues & Evidence-Based Fixes
                  </h3>
                  <p className="text-xs text-[#8C8479] mt-0.5">
                    Every issue is backed by empirical evidence extracted directly from your document.
                  </p>
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-[#F5F3EE] p-1 rounded-md text-xs font-mono">
                    {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
                      <button
                        key={sev}
                        onClick={() => setSeverityFilter(sev)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          severityFilter === sev
                            ? "bg-white text-[#181614] shadow-2xs"
                            : "text-[#8C8479] hover:text-[#181614]"
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>

                  {categoryFilter !== "ALL" && (
                    <button
                      onClick={() => setCategoryFilter("ALL")}
                      className="px-2 py-1 rounded text-[10px] font-mono text-[#9E2A2B] bg-[#FCEEEE] hover:bg-[#F7D0D0] transition-colors cursor-pointer"
                    >
                      Clear Category Filter ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Issues List */}
              {filteredIssues.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#2E6347] mx-auto" />
                  <p className="text-sm font-semibold text-[#181614]">No issues matching this filter</p>
                  <p className="text-xs text-[#8C8479]">Your resume complies with standard criteria in this category.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredIssues.map((issue) => (
                    <div
                      key={issue.issueId}
                      className="p-4 rounded-lg border border-[#E5E0D4] bg-[#FAF8F5] space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${getSeverityStyle(issue.severity)}`}>
                            {issue.severity}
                          </span>
                          <span className="font-mono text-[10px] text-[#8C8479]">
                            {issue.issueId} • {issue.affectedSection}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono font-bold text-[#9E2A2B]">
                          -{issue.pointsImpact} PTS IMPACT
                        </span>
                      </div>

                      <h4 className="font-serif font-bold text-sm text-[#181614]">
                        {issue.title}
                      </h4>

                      {/* Evidence Snippet */}
                      <div className="p-2.5 bg-white border border-[#E5E0D4] rounded text-xs font-mono text-[#5C564E] leading-relaxed">
                        <span className="text-[9px] uppercase tracking-wider text-[#8C8479] block mb-0.5">
                          Extracted Evidence:
                        </span>
                        <span>"{issue.evidence}"</span>
                      </div>

                      {/* Why it Matters & Recommendation */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-[#8C8479] font-bold block mb-0.5">
                            Why this matters:
                          </span>
                          <p className="text-[#5C564E] leading-relaxed">
                            {issue.description}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase text-[#2E6347] font-bold block mb-0.5">
                            Actionable Recommendation:
                          </span>
                          <p className="text-[#181614] leading-relaxed">
                            {issue.recommendation}
                          </p>
                        </div>
                      </div>

                      {/* Before / After Illustrative Fix */}
                      {issue.beforeExample && issue.afterExample && (
                        <div className="p-3 bg-white border border-[#E5E0D4] rounded text-xs space-y-1.5 mt-2">
                          <div className="flex items-start gap-2 text-[#9E2A2B]">
                            <span className="font-mono text-[10px] font-bold uppercase shrink-0 mt-0.5">
                              [Weak]:
                            </span>
                            <span className="line-through">{issue.beforeExample}</span>
                          </div>
                          <div className="flex items-start gap-2 text-[#2E6347]">
                            <span className="font-mono text-[10px] font-bold uppercase shrink-0 mt-0.5">
                              [ATS Better]:
                            </span>
                            <span className="font-semibold">{issue.afterExample}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Section G: Improvement Roadmap ── */}
            <div className="bg-white rounded-lg border border-[#E5E0D4] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E0D4] pb-3">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#181614]">
                    Prioritized Action Roadmap
                  </h3>
                  <p className="text-xs text-[#8C8479] mt-0.5">
                    Follow these step-by-step priority fixes to boost your ATS conversion.
                  </p>
                </div>
                <MechanicalButton
                  variant="vermilion"
                  size="sm"
                  onClick={handleOpenImprovements}
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Launch Interactive Optimizer
                </MechanicalButton>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentAnalysis.improvementRoadmap.map((item) => (
                  <div
                    key={item.priority}
                    className="p-4 bg-[#FAF8F5] border border-[#E5E0D4] rounded-lg space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-5 h-5 rounded-full bg-white border border-[#E5E0D4] text-[#C84B26] font-mono text-[10px] font-bold flex items-center justify-center">
                        {item.priority}
                      </span>
                      <span className="text-[10px] font-mono uppercase text-[#8C8479]">
                        {item.category}
                      </span>
                    </div>
                    <h5 className="font-serif font-bold text-xs text-[#181614]">
                      {item.title}
                    </h5>
                    <p className="text-xs text-[#5C564E] leading-relaxed">
                      {item.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Past Reports Modal ── */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg border border-[#E5E0D4] shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-[#E5E0D4] pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#C84B26]" />
                  <h3 className="font-serif font-bold text-base text-[#181614]">
                    Previous ATS Scans
                  </h3>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1 text-[#8C8479] hover:text-[#181614] rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {historyList.length === 0 ? (
                  <p className="text-xs text-[#8C8479] text-center py-8">
                    No historical scans recorded yet.
                  </p>
                ) : (
                  historyList.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => item._id && handleSelectHistoryReport(item._id)}
                      className="p-3 bg-[#FAF8F5] hover:bg-[#F5F3EE] border border-[#E5E0D4] rounded-md transition-colors cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#181614] truncate">
                          {item.fileName}
                        </p>
                        <p className="text-[10px] font-mono text-[#8C8479]">
                          {item.targetRole} • {item.analysisMode} •{" "}
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-serif font-bold text-sm text-[#181614]">
                          {item.overallScore}/100
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#C84B26]" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Side-by-Side Resume Improvement Modal ── */}
      <AnimatePresence>
        {showImproveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg border border-[#E5E0D4] shadow-xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-[#E5E0D4] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C84B26]" />
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#181614]">
                      Interactive Resume Optimizer
                    </h3>
                    <p className="text-[11px] font-mono text-[#8C8479]">
                      Side-by-side proposed improvements based strictly on verified candidate data.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowImproveModal(false)}
                  className="p-1 text-[#8C8479] hover:text-[#181614] rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {loadingImprovements ? (
                  <div className="text-center py-12 space-y-3">
                    <RefreshCw className="w-6 h-6 text-[#C84B26] animate-spin mx-auto" />
                    <p className="text-xs font-mono text-[#8C8479]">
                      Formulating ATS-aligned active-voice rewrites...
                    </p>
                  </div>
                ) : improvements.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-[#2E6347] mx-auto" />
                    <p className="text-sm font-semibold text-[#181614]">No further bullet improvements needed</p>
                    <p className="text-xs text-[#8C8479]">Your bullets already feature active voice and quantified deliverables.</p>
                  </div>
                ) : (
                  improvements.map((imp) => {
                    const isAccepted = acceptedImprovements[imp.id];

                    return (
                      <div
                        key={imp.id}
                        className={`p-4 rounded-lg border transition-all space-y-3 ${
                          isAccepted
                            ? "bg-[#EBF3EE] border-[#D0E3D6]"
                            : "bg-[#FAF8F5] border-[#E5E0D4]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-xs text-[#181614]">
                            {imp.title}
                          </span>
                          <span className="text-[10px] font-mono text-[#2E6347] font-bold">
                            +{imp.pointsImpact} PTS POTENTIAL
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {/* Original Text */}
                          <div className="p-3 bg-white border border-[#E5E0D4] rounded">
                            <span className="text-[9px] font-mono uppercase text-[#9E2A2B] font-bold block mb-1">
                              Original Text
                            </span>
                            <p className="text-[#5C564E] leading-relaxed line-through">
                              {imp.originalText}
                            </p>
                          </div>

                          {/* Improved Text */}
                          <div className="p-3 bg-white border border-[#D0E3D6] rounded">
                            <span className="text-[9px] font-mono uppercase text-[#2E6347] font-bold block mb-1">
                              ATS-Optimized Version
                            </span>
                            <p className="text-[#181614] leading-relaxed font-semibold">
                              {imp.improvedText}
                            </p>
                          </div>
                        </div>

                        <p className="text-[11px] text-[#8C8479] italic">
                          Rationale: {imp.rationale}
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(imp.improvedText);
                            }}
                            className="px-2.5 py-1 rounded bg-white border border-[#E5E0D4] text-[11px] font-mono text-[#181614] hover:bg-[#F5F3EE] flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3 text-[#8C8479]" /> Copy Text
                          </button>

                          <button
                            onClick={() => {
                              setAcceptedImprovements((prev) => ({
                                ...prev,
                                [imp.id]: !prev[imp.id],
                              }));
                            }}
                            className={`px-3 py-1 rounded text-[11px] font-mono font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                              isAccepted
                                ? "bg-[#2E6347] text-white"
                                : "bg-[#172535] text-white hover:bg-[#23384E]"
                            }`}
                          >
                            {isAccepted ? "Accepted ✓" : "Accept Suggestion"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-between border-t border-[#E5E0D4] pt-3">
                <span className="text-xs font-mono text-[#8C8479]">
                  {Object.values(acceptedImprovements).filter(Boolean).length} of {improvements.length} suggestions accepted
                </span>
                <MechanicalButton
                  variant="vermilion"
                  size="sm"
                  onClick={() => {
                    setShowImproveModal(false);
                    // Trigger re-scan for Before vs After comparison
                    if (currentAnalysis) {
                      handleStartAnalysis();
                    }
                  }}
                >
                  Save & Re-Scan (Compare Before/After)
                </MechanicalButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
