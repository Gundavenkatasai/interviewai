import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Shield,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Download,
  Eye,
  Edit3,
  RefreshCw,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronRight,
  Check,
  Cpu,
  Compass,
  FileSpreadsheet,
  Zap,
  TrendingUp,
  Sliders,
  ExternalLink
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ApiClient, ITemplateMetadata, IResumeExtractionResult, ATSReport } from "../../../lib/api";
import { ResumeRenderer } from "./templates/ResumeRenderer";
import { ExtractionReviewModal } from "./ExtractionReviewModal";

const CATEGORIES = [
  "All",
  "ATS Classic",
  "ATS Modern",
  "ATS Minimal",
  "Technical",
  "Executive",
  "Finance",
  "Engineering",
  "Professional"
];

// Sample baseline profile for zero-flicker real preview rendering in gallery
const SAMPLE_GALLERY_PROFILE = {
  basics: {
    name: "Alex Morgan",
    label: "Lead Software Engineer",
    email: "alex.morgan@example.com",
    phone: "(555) 019-2834",
    location: "San Francisco, CA"
  },
  personal: {
    fullName: "Alex Morgan",
    professionalTitle: "Lead Software Engineer",
    email: "alex.morgan@example.com",
    phone: "(555) 019-2834",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/alexmorgan",
    github: "github.com/alexmorgan"
  },
  summary:
    "Results-driven Lead Software Engineer with 7+ years of expertise architecting high-scale distributed backend systems and real-time streaming architectures.",
  experience: [
    {
      id: "exp1",
      role: "Lead Software Engineer",
      company: "Stripe",
      startDate: "2021",
      endDate: "Present",
      location: "San Francisco, CA",
      bullets: [
        "Architected distributed event-driven payment pipelines processing 45M+ daily transactions with 99.999% SLA.",
        "Engineered low-latency caching tiers cutting average API response times by 38% across core services."
      ]
    },
    {
      id: "exp2",
      role: "Senior Backend Developer",
      company: "Cloudflare",
      startDate: "2018",
      endDate: "2021",
      location: "Austin, TX",
      bullets: [
        "Developed edge compute workers deployed across 200+ global data centers.",
        "Scaled zero-trust network ingress routing handling 12 Gbps peak throughput."
      ]
    }
  ],
  education: [
    {
      id: "edu1",
      institution: "Stanford University",
      degree: "B.S.",
      field: "Computer Science",
      endDate: "2018",
      gpa: "3.9"
    }
  ],
  skills: {
    languages: ["TypeScript", "Go", "Python", "Rust"],
    frameworks: ["Node.js", "React", "Next.js", "Fastify"],
    cloud: ["AWS", "Docker", "Kubernetes", "Terraform"],
    databases: ["PostgreSQL", "Redis", "MongoDB"],
    tools: ["Git", "Kafka", "CI/CD", "Prometheus"]
  },
  projects: [
    {
      id: "proj1",
      name: "Distributed Task Scheduler",
      technologies: ["Go", "gRPC", "Raft"],
      url: "github.com/alexmorgan/scheduler",
      bullets: ["Built distributed task coordinator supporting atomic leader election and fault-tolerant queue replication."]
    }
  ],
  certifications: [
    {
      name: "AWS Certified Solutions Architect – Professional",
      issuer: "Amazon Web Services",
      date: "2023"
    }
  ]
};

export const AtsTemplateGeneratorWorkspace: React.FC = () => {
  // Workflow Navigation Stage
  const [stage, setStage] = useState<"gallery" | "upload" | "review" | "studio">("gallery");

  // Template Catalog State
  const [templates, setTemplates] = useState<ITemplateMetadata[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTemplateId, setSelectedTemplateId] = useState("ats_classic");
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Upload & Extraction State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [showPasteText, setShowPasteText] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Extraction Review State
  const [extractionResult, setExtractionResult] = useState<IResumeExtractionResult | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generated Resume & Studio State
  const [activeResume, setActiveResume] = useState<any | null>(null);
  const [atsReport, setAtsReport] = useState<ATSReport | null>(null);
  const [paperSize, setPaperSize] = useState<"a4" | "letter">("a4");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isSwitchingTemplate, setIsSwitchingTemplate] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Templates Catalog on Mount
  useEffect(() => {
    async function loadTemplates() {
      setLoadingTemplates(true);
      try {
        const list = await ApiClient.getResumeTemplates();
        if (list && list.length > 0) {
          setTemplates(list);
        }
      } catch (err) {
        console.warn("Could not fetch remote templates catalog, using fallbacks:", err);
      } finally {
        setLoadingTemplates(false);
      }
    }
    loadTemplates();
  }, []);

  // Filtered Templates
  const filteredTemplates = templates.filter((t) => {
    if (selectedCategory === "All") return true;
    return (
      t.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      t.name.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      t.recommendedRoles.some((r) => r.toLowerCase().includes(selectedCategory.toLowerCase()))
    );
  });

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  // Handle Template Selection in Gallery
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setStage("upload");
  };

  // Handle File Upload & Deterministic Parsing
  const handleUploadResume = async (fileToUpload?: File) => {
    const file = fileToUpload || uploadFile;
    if (!file && !rawText.trim()) {
      setParseError("Please select a file or paste your resume text to proceed.");
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {
      let result: IResumeExtractionResult;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("filename", file.name);
        result = await ApiClient.importResumeForTemplate(formData);
      } else {
        result = await ApiClient.importResumeForTemplate({ rawText });
      }

      if (result && result.extractedData) {
        setExtractionResult(result);
        setReviewModalOpen(true);
      } else {
        throw new Error("Could not extract structured data from resume.");
      }
    } catch (err: any) {
      setParseError(err.message || "Failed to extract resume text. Please check the file format.");
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Verified Content Confirmation & Generation
  const handleConfirmExtraction = async (verifiedData: any) => {
    setIsGenerating(true);
    try {
      const res = await ApiClient.generateResumeFromTemplate({
        templateId: selectedTemplateId,
        profileData: verifiedData,
        importId: extractionResult?.importId,
        jobDescription,
        targetRole
      });

      if (res.success && res.resume) {
        setActiveResume(res.resume);
        setAtsReport(res.atsReport);
        setReviewModalOpen(false);
        setStage("studio");
      } else {
        throw new Error("Resume generation failed.");
      }
    } catch (err: any) {
      setParseError(err.message || "Failed to generate resume.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Template Switching inside Studio
  const handleSwitchTemplate = async (newTemplateId: string) => {
    if (!activeResume || activeResume.template === newTemplateId) return;
    setIsSwitchingTemplate(true);
    try {
      const res = await ApiClient.switchResumeTemplate(activeResume._id, newTemplateId);
      if (res.success && res.resume) {
        setActiveResume(res.resume);
        if (res.atsReport) {
          setAtsReport(res.atsReport);
        }
      }
    } catch (err: any) {
      console.error("Failed to switch template:", err);
    } finally {
      setIsSwitchingTemplate(false);
    }
  };

  // Export Handlers
  const handleDownloadPdf = async () => {
    if (!previewRef.current || !activeResume) return;
    setIsExportingPdf(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", paperSize);
      const pageWidth = paperSize === "letter" ? 215.9 : 210;
      const pageHeight = paperSize === "letter" ? 279.4 : 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      const name = (
        activeResume.profileData?.personal?.fullName ||
        activeResume.profileData?.basics?.name ||
        "ATS_Resume"
      ).replace(/\s+/g, "_");
      pdf.save(`${name}_${activeResume.template || "ATS"}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!activeResume) return;
    setIsExportingDocx(true);
    try {
      const blob = await ApiClient.exportDocx(activeResume._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const name = (
        activeResume.profileData?.personal?.fullName ||
        activeResume.profileData?.basics?.name ||
        "ATS_Resume"
      ).replace(/\s+/g, "_");
      a.download = `${name}_${activeResume.template || "ATS"}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("DOCX export failed:", err);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleDownloadJson = () => {
    if (!activeResume) return;
    const jsonStr = JSON.stringify(activeResume.profileData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(activeResume.name || "resume").replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full flex flex-col min-h-[calc(100vh-80px)] text-slate-100 font-sans">
      {/* =============================================================== */}
      {/* 1. STAGE: TEMPLATE GALLERY (Step 1 & 2)                          */}
      {/* =============================================================== */}
      {stage === "gallery" && (
        <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              Machine-Readable • 100% Deterministic • Anti-Hallucination
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              ATS Resume Template Gallery
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Select a certified ATS-friendly design. Your uploaded resume is the{" "}
              <strong className="text-slate-200">source of truth for content</strong>; the selected
              template is the{" "}
              <strong className="text-slate-200">source of truth for design</strong>.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 scale-105"
                    : "bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Template Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const isSelected = selectedTemplateId === template.id;

              return (
                <div
                  key={template.id}
                  className={`group relative flex flex-col bg-slate-900/90 border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-2xl hover:border-indigo-500/50 ${
                    isSelected ? "border-indigo-500 ring-2 ring-indigo-500/30" : "border-slate-800"
                  }`}
                >
                  {/* Miniature Real Rendered Preview Frame */}
                  <div className="relative w-full h-72 bg-slate-950/80 border-b border-slate-800/80 overflow-hidden flex items-start justify-center p-4">
                    <div
                      className="w-[210mm] min-h-[297mm] transform origin-top scale-[0.27] shadow-xl pointer-events-none select-none transition-transform duration-300 group-hover:scale-[0.28]"
                    >
                      <ResumeRenderer
                        resume={{
                          template: template.id,
                          profileData: SAMPLE_GALLERY_PROFILE
                        }}
                        paperSize="a4"
                      />
                    </div>
                    {/* Hover Glow Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60 pointer-events-none" />

                    {/* ATS Badge Top Right */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold shadow-lg backdrop-blur-md">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {template.atsCompatibilityScore}% ATS Score
                    </div>
                  </div>

                  {/* Template Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-white tracking-tight">
                          {template.name}
                        </h3>
                        <span className="text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          {template.layout}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {template.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800/70 text-xs">
                      <div>
                        <span className="text-slate-500 font-medium">Best for: </span>
                        <span className="text-slate-300 font-medium">
                          {template.recommendedRoles.slice(0, 3).join(", ")}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Typography: </span>
                        <span className="text-slate-400">{template.typography}</span>
                      </div>
                    </div>

                    {/* Primary Button */}
                    <button
                      onClick={() => handleSelectTemplate(template.id)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                        isSelected
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                          : "bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white"
                      }`}
                    >
                      Use This Template
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* 2. STAGE: UPLOAD EXISTING RESUME (Step 3 & 4)                   */}
      {/* =============================================================== */}
      {stage === "upload" && (
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
          <button
            onClick={() => setStage("gallery")}
            className="self-start inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Template Gallery
          </button>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Template Selected Banner */}
            <div className="flex items-center justify-between p-4 bg-indigo-950/40 border border-indigo-500/25 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                    Selected Template
                  </span>
                  <h3 className="text-sm font-bold text-white">{selectedTemplate?.name}</h3>
                </div>
              </div>
              <button
                onClick={() => setStage("gallery")}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline"
              >
                Change
              </button>
            </div>

            {/* Instruction */}
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Bring Your Existing Resume
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload your current resume. We will deterministically extract your experience,
                education, and skills into a canonical model, let you verify every field, and then
                generate your new resume using <strong>{selectedTemplate?.name}</strong>.
              </p>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setUploadFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                uploadFile
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-slate-700 hover:border-indigo-500 hover:bg-slate-800/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setUploadFile(e.target.files[0]);
                  }
                }}
              />

              <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <Upload className="w-6 h-6" />
              </div>

              {uploadFile ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {uploadFile.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(uploadFile.size / 1024).toFixed(1)} KB • Click to replace file
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">
                    Drag and drop your resume here, or{" "}
                    <span className="text-indigo-400 underline">browse files</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Supports PDF, DOCX, TXT, and JSON Resume schemas (Max 15MB)
                  </p>
                </div>
              )}
            </div>

            {/* Optional Target Job Description */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Target Job Description (Optional)
                </label>
                <span className="text-[11px] text-slate-500">For keyword optimization</span>
              </div>
              <textarea
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste job description text here to automatically compare keyword match and role alignment..."
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Error Message */}
            {parseError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {parseError}
              </div>
            )}

            {/* Submit Action */}
            <button
              onClick={() => handleUploadResume()}
              disabled={isParsing || (!uploadFile && !rawText.trim())}
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isParsing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Extracting Resume Content Deterministically...
                </>
              ) : (
                <>
                  Extract & Review Resume Content
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* 3. STAGE: 3-PANE RESUME STUDIO WORKSPACE (Step 8, 9, 10, 11)   */}
      {/* =============================================================== */}
      {stage === "studio" && activeResume && (
        <div className="flex-1 flex flex-col h-[calc(100vh-80px)] overflow-hidden">
          {/* Top Control Bar */}
          <div className="h-14 px-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
            {/* Left Title & Status */}
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-white truncate max-w-[240px]">
                {activeResume.name || "My ATS Resume"}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                {activeResume.template?.toUpperCase()}
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Version {activeResume.version || 1}
              </span>
            </div>

            {/* Center Controls: Paper Size & Zoom */}
            <div className="hidden md:flex items-center gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setPaperSize("a4")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  paperSize === "a4" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                A4
              </button>
              <button
                onClick={() => setPaperSize("letter")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  paperSize === "letter" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Letter
              </button>

              <div className="h-3.5 w-px bg-slate-800 mx-1" />

              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                className="p-1 text-slate-400 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono text-slate-300 w-10 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="p-1 text-slate-400 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReviewModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit Content</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExportingPdf ? "Exporting..." : "Download PDF"}</span>
              </button>

              <button
                onClick={handleDownloadDocx}
                disabled={isExportingDocx}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition disabled:opacity-50"
              >
                <span>{isExportingDocx ? "Exporting..." : "DOCX"}</span>
              </button>

              <button
                onClick={handleDownloadJson}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Export JSON"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3-Pane Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* ------------------------------------------------------------- */}
            {/* LEFT PANE: Quick Template Switcher                            */}
            {/* ------------------------------------------------------------- */}
            <aside className="w-64 p-4 border-r border-slate-800 bg-slate-950/40 flex flex-col gap-2 overflow-y-auto shrink-0 hidden lg:flex">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Switch Template
                </h3>
                <span className="text-[11px] text-slate-500">Zero data loss</span>
              </div>

              <div className="space-y-1.5">
                {templates.map((t) => {
                  const isActive = activeResume.template === t.id;

                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSwitchTemplate(t.id)}
                      disabled={isSwitchingTemplate || isActive}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isActive
                          ? "bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-500/10"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-200">{t.name}</span>
                        {isActive && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{t.layout}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium">{t.atsCompatibilityScore}% ATS</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-auto pt-4 border-t border-slate-800/80">
                <button
                  onClick={() => setStage("gallery")}
                  className="w-full py-2 px-3 rounded-xl border border-slate-700 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition text-center"
                >
                  Browse Full Gallery
                </button>
              </div>
            </aside>

            {/* ------------------------------------------------------------- */}
            {/* CENTER PANE: Live Resume Preview (Print Accurate)             */}
            {/* ------------------------------------------------------------- */}
            <main className="flex-1 overflow-auto bg-slate-950 p-6 sm:p-10 flex items-start justify-center">
              <div
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
                className="transition-transform duration-150"
              >
                <ResumeRenderer
                  ref={previewRef}
                  resume={activeResume}
                  paperSize={paperSize}
                />
              </div>
            </main>

            {/* ------------------------------------------------------------- */}
            {/* RIGHT PANE: Real ATS Scorecard & Health Report                */}
            {/* ------------------------------------------------------------- */}
            <aside className="w-80 border-l border-slate-800 bg-slate-900/80 p-5 overflow-y-auto shrink-0 hidden xl:flex flex-col gap-5">
              {/* Scorecard Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Real ATS Scan Results
                </h3>
                {atsReport && (
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      atsReport.overallScore >= 85
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : atsReport.overallScore >= 70
                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                        : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    Grade: {atsReport.grade || "A"}
                  </span>
                )}
              </div>

              {/* Score Ring Display */}
              {atsReport ? (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center gap-4">
                  <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-emerald-400"
                        strokeDasharray={`${atsReport.overallScore}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-base font-extrabold text-white">
                      {atsReport.overallScore}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">
                      {atsReport.overallScore >= 85
                        ? "ATS High Match"
                        : atsReport.overallScore >= 70
                        ? "Moderate Match"
                        : "Needs Optimization"}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Calculated from real plain-text ATS tokens using deterministic heuristics.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-center text-xs text-slate-500">
                  ATS Score unavailable
                </div>
              )}

              {/* Category Scores Breakdown */}
              {atsReport?.categoryScores && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Category Breakdown
                  </h4>
                  <div className="space-y-2 text-xs">
                    {Object.entries(atsReport.categoryScores).map(([cat, score]) => (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400 capitalize">
                            {cat.replace(/([A-Z])/g, " $1")}
                          </span>
                          <span className="font-mono text-slate-200 font-semibold">{score}/100</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                            className={`h-full rounded-full ${
                              score >= 80 ? "bg-emerald-400" : score >= 60 ? "bg-blue-400" : "bg-amber-400"
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Strengths */}
              {atsReport?.strengths && atsReport.strengths.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Identified Strengths
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {atsReport.strengths.slice(0, 3).map((st, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actionable ATS Issues */}
              {atsReport?.issues && atsReport.issues.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Actionable Improvements ({atsReport.issues.length})
                  </h4>
                  <div className="space-y-2 text-xs max-h-60 overflow-y-auto pr-1">
                    {atsReport.issues.slice(0, 5).map((issue, i) => (
                      <div
                        key={issue.id || i}
                        className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-indigo-400">
                            {issue.id}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              issue.severity === "critical"
                                ? "bg-rose-500/20 text-rose-300"
                                : issue.severity === "high"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-blue-500/20 text-blue-300"
                            }`}
                          >
                            {issue.severity}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-200 text-xs">{issue.title}</p>
                        <p className="text-[11px] text-slate-400 leading-snug">{issue.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      )}

      {/* Extraction Review Modal */}
      {extractionResult && (
        <ExtractionReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          extractedData={activeResume?.profileData || extractionResult.extractedData}
          fieldConfidence={extractionResult.fieldConfidence}
          warnings={extractionResult.warnings}
          templateName={selectedTemplate?.name}
          onConfirm={handleConfirmExtraction}
          isGenerating={isGenerating}
        />
      )}
    </div>
  );
};
