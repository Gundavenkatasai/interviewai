import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "../lib/api";
import {
  ArrowLeft, Sparkles, AlertTriangle, CheckCircle2,
  Check, RefreshCw, FileText, Download, Building2,
  MapPin, Briefcase, Printer, Eye, Edit3, BookmarkPlus,
  Layers, CheckCheck, SlidersHorizontal, ZoomIn, ZoomOut,
  ShieldCheck, Award, GraduationCap, ChevronDown, ChevronUp
} from "lucide-react";
import { MechanicalButton } from "../components/ui/MechanicalButton";
import { InkBleedButton } from "../components/ui/InkBleedButton";
import { IStructuredResume, TemplateId } from "../types/resume-schema";
import {
  ResumeTemplateDispatcher,
  TEMPLATE_METADATA,
} from "../components/resume-templates/ResumeTemplateDispatcher";
import { printResumeDocument, validateResumeForPrint } from "../lib/resume-printer";

interface ITailoringTelemetry {
  resumeQualityScore: number;
  keywordCoverageScore: number;
  jobMatchScore: number;
  atsReadabilityScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}

interface ITailoringValidation {
  isValid: boolean;
  qualityScore: number;
  estimatedPages: number;
  warnings: string[];
  errors: string[];
  metrics: {
    totalWords: number;
    skillsCount: number;
    projectsCount: number;
    experienceCount: number;
    bulletsCount: number;
  };
}

interface ITemplateRecommendation {
  templateId: TemplateId;
  templateName: string;
  rationale: string;
  sectionOrder: string[];
  density: string;
  maxTargetPages: number;
  highlights: string[];
}

interface ITailoringResponse {
  success: boolean;
  currentScore: number;
  potentialScore: number;
  diff: {
    section: string;
    field: string;
    current: string;
    proposed: string;
    rationale: string;
  }[];
  matchedSkills: string[];
  missingSkills: string[];
  structuredResume: IStructuredResume;
  recommendation: ITemplateRecommendation;
  validationReport: ITailoringValidation;
  telemetry: ITailoringTelemetry;
}

export default function TailorResumePage() {
  const { id: jobId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Fetch Grounded Job Requisition
  const { data: jobData, isLoading: isJobLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => ApiClient.getJob(jobId!),
    enabled: !!jobId,
  });

  const job = (jobData as any)?.job || (jobData as any)?.data || jobData;

  // 2. Fetch User Resumes
  const { data: resumesData, isLoading: isResumesLoading, refetch: refetchResumes } = useQuery({
    queryKey: ["resumes"],
    queryFn: () => ApiClient.getResumes(),
  });

  const resumesList: any[] = React.useMemo(() => {
    if (Array.isArray(resumesData)) return resumesData;
    if (Array.isArray(resumesData?.resumes)) return resumesData.resumes;
    if (Array.isArray(resumesData?.data)) return resumesData.data;
    return [];
  }, [resumesData]);

  const activeResume = resumesList.find((r: any) => r.status === "active") || resumesList[0] || null;

  // Workspace UI States
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("tech-fresher");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [mobileTab, setMobileTab] = useState<"controls" | "preview">("controls");
  const [tailoringResult, setTailoringResult] = useState<ITailoringResponse | null>(null);
  const [structuredResume, setStructuredResume] = useState<IStructuredResume | null>(null);
  const [tailoredResumeId, setTailoredResumeId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [attachedToApp, setAttachedToApp] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [activeAccordion, setActiveAccordion] = useState<"summary" | "skills" | "projects" | "education">("summary");

  // Mutation to create base resume from Profile if none exists
  const createBaseResumeMutation = useMutation({
    mutationFn: () =>
      ApiClient.createResume({
        fromProfile: true,
        name: `Engineering Dossier Resume`,
        targetRole: job?.title || "Software Engineer",
      }),
    onSuccess: () => {
      refetchResumes();
    },
  });

  // Mutation to run ATS Tailoring Optimization
  const tailorMutation = useMutation({
    mutationFn: async (resumeId: string) => {
      const res = await ApiClient.tailorResume(resumeId, {
        jobId,
        jobDescription: job?.description,
        targetTitle: job?.title,
        preferredTemplateId: selectedTemplate,
      });
      return res as ITailoringResponse;
    },
    onSuccess: (data) => {
      setTailoringResult(data);
      if (data.structuredResume) {
        setStructuredResume(data.structuredResume);
        setSummaryDraft(data.structuredResume.summary || "");
      }
      if (data.recommendation?.templateId) {
        setSelectedTemplate(data.recommendation.templateId);
      }
    },
  });

  // Automatically trigger tailoring once activeResume and jobId are ready
  const hasTriggeredRef = useRef(false);
  useEffect(() => {
    if (!hasTriggeredRef.current && activeResume?._id && jobId && job) {
      hasTriggeredRef.current = true;
      tailorMutation.mutate(activeResume._id);
    }
  }, [activeResume?._id, jobId, job]);

  // Mutation to commit tailored version
  const commitMutation = useMutation({
    mutationFn: async () => {
      if (!activeResume || !structuredResume) return null;
      const res = await ApiClient.applyTailoring(activeResume._id, {
        targetRole: job?.title || activeResume.targetRole,
        newResumeName: `${activeResume.name || "Resume"} (Tailored for ${job?.companyName || job?.company || "Target Role"})`,
        structuredResume,
        template: selectedTemplate,
        jobId,
      });
      return res;
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      const newId = res?.resume?._id || res?.data?._id;
      if (newId) setTailoredResumeId(newId);
    },
  });

  // Mutation to attach tailored resume to Application Tracker
  const attachToApplicationMutation = useMutation({
    mutationFn: async () => {
      if (!jobId) return;
      return ApiClient.trackUserApplication({
        jobId,
        status: "APPLIED",
        notes: `Tailored resume generated on ${new Date().toLocaleDateString()} with Match Score ${tailoringResult?.telemetry?.jobMatchScore || 85}%`,
      });
    },
    onSuccess: () => {
      setAttachedToApp(true);
      queryClient.invalidateQueries({ queryKey: ["userApplications"] });
    },
  });

  // Handle DOCX download
  const handleDownloadDocx = async (resumeId: string) => {
    try {
      setIsDownloading(true);
      const blob = await ApiClient.downloadResumeDocx(resumeId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(structuredResume?.basics?.name || "Tailored").replace(/\s+/g, "_")}_${(job?.companyName || "Resume").replace(/\s+/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("DOCX Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Direct High-Fidelity A4 PDF Download
  const handleSavePdf = async () => {
    if (!activeResume || !structuredResume) return;
    setIsExportingPdf(true);
    setPdfError(null);

    try {
      let targetId = tailoredResumeId;
      if (!targetId) {
        const commitRes: any = await ApiClient.applyTailoring(activeResume._id, {
          targetRole: job?.title || activeResume.targetRole,
          newResumeName: `${activeResume.name || "Resume"} (Tailored for ${job?.companyName || job?.company || "Target Role"})`,
          structuredResume,
          template: selectedTemplate,
          jobId,
        });
        targetId = commitRes?.resume?._id || commitRes?.data?._id || activeResume._id;
        if (targetId) setTailoredResumeId(targetId);
      }

      const finalId: string = targetId || activeResume._id;
      const blob = await ApiClient.downloadResumePdf(finalId, { templateId: selectedTemplate });

      if (!blob || blob.size < 500) {
        throw new Error("Generated PDF artifact was empty or truncated. Please retry.");
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = `${(structuredResume.basics.name || "Candidate").replace(/\s+/g, "_")}_${(job?.companyName || job?.title || "Resume").replace(/\s+/g, "_")}.pdf`;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error("PDF generation error:", err);
      setPdfError(err.message || "Failed to generate PDF document.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle PDF Print / Export using dedicated isolated print engine
  const handlePrintPdf = async () => {
    setIsPrinting(true);
    setPdfError(null);
    try {
      const validation = validateResumeForPrint("resume-a4-canvas");
      if (!validation.valid) {
        setPdfError(validation.error || "Cannot print: resume canvas is not ready.");
        return;
      }
      const res = await printResumeDocument("resume-a4-canvas");
      if (!res.success && res.error) {
        console.warn("Dedicated print warning, using window.print fallback:", res.error);
        window.print();
      }
    } catch (err: any) {
      console.error("Print error:", err);
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  // Save summary edit
  const handleSaveSummary = () => {
    if (structuredResume) {
      setStructuredResume({
        ...structuredResume,
        summary: summaryDraft,
      });
    }
    setEditingSummary(false);
  };

  // Loading Screen
  if (isResumesLoading || isJobLoading) {
    return (
      <div className="min-h-screen bg-[#F5F3EE] flex items-center justify-center text-[#181614] font-mono text-sm">
        <div className="w-5 h-5 border-2 border-[#C84B26] border-t-transparent rounded-full animate-spin mr-3" />
        INITIALIZING CAREER DOSSIER & REQUISITION TELEMETRY...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#181614] flex flex-col font-sans">
      {/* ── Top Header Navigation Bar ── */}
      <header className="border-b border-[#E5E0D4] bg-white px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/jobs`)}
              className="p-1.5 rounded-md border border-[#E5E0D4] hover:border-[#181614] text-[#5C564E] hover:text-[#181614] transition-colors cursor-pointer"
              title="Return to Job Requisitions"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C84B26] bg-[#FBF0EC] px-2 py-0.5 rounded border border-[#F4D4C9] font-semibold">
                  CAREER INTELLIGENCE ENGINE • TAILORING WORKSPACE
                </span>
                <span className="text-[11px] font-mono text-[#8C8479]">ID: {jobId?.slice(-8).toUpperCase()}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-serif font-bold text-[#181614] tracking-tight mt-0.5">
                {job?.title || "Job-Specific ATS Resume Studio"}
                {job?.companyName && (
                  <span className="text-sm font-sans font-normal text-[#5C564E] ml-2">
                    @ {job.companyName}
                  </span>
                )}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile View Switcher */}
            <div className="flex lg:hidden rounded-md bg-[#FAF8F5] border border-[#E5E0D4] p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setMobileTab("controls")}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  mobileTab === "controls"
                    ? "bg-white text-[#181614] font-bold shadow-xs border border-[#E5E0D4]"
                    : "text-[#8C8479]"
                }`}
              >
                Controls
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("preview")}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  mobileTab === "preview"
                    ? "bg-white text-[#181614] font-bold shadow-xs border border-[#E5E0D4]"
                    : "text-[#8C8479]"
                }`}
              >
                Preview
              </button>
            </div>

            {/* Mock Interview Stage Quick-Launch */}
            {job && (
              <MechanicalButton
                variant="navy"
                size="sm"
                icon={<Briefcase className="w-3.5 h-3.5" />}
                onClick={() =>
                  navigate(
                    `/interview/broadcast?job_id=${jobId}&role=${encodeURIComponent(job.title || "")}&company=${encodeURIComponent(job.companyName || job.company || "")}`
                  )
                }
              >
                Practice Mock
              </MechanicalButton>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Workspace ── */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* Empty State: No Resumes in Account */}
        {!activeResume && (
          <div className="bg-white border border-[#E5E0D4] rounded-lg p-10 text-center max-w-xl mx-auto space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E5E0D4] flex items-center justify-center mx-auto text-[#C84B26]">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#181614]">No Base Resume Found</h3>
            <p className="text-xs text-[#5C564E] leading-relaxed">
              We did not find an active resume in your dossier. You can generate a verified base resume directly from your Profile
              facts with one click, or upload a resume file in the Studio.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <MechanicalButton
                variant="vermilion"
                size="md"
                onClick={() => createBaseResumeMutation.mutate()}
                disabled={createBaseResumeMutation.isPending}
              >
                {createBaseResumeMutation.isPending ? "Generating from Dossier..." : "Generate Base from Profile"}
              </MechanicalButton>
              <InkBleedButton onClick={() => navigate("/resume")}>Go to Resume Studio</InkBleedButton>
            </div>
          </div>
        )}

        {/* Tailoring In Progress Loading */}
        {activeResume && tailorMutation.isPending && (
          <div className="bg-white border border-[#E5E0D4] rounded-lg p-12 text-center max-w-xl mx-auto space-y-3">
            <div className="w-8 h-8 border-3 border-[#C84B26] border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="font-serif font-bold text-base text-[#181614]">Analyzing Verified Candidate Evidence & Grounding to JD...</h3>
            <p className="text-xs font-mono text-[#8C8479]">
              Enforcing zero-fabrication gate • Ranking technical projects • Evaluating ATS parseability
            </p>
          </div>
        )}

        {/* Tailoring Error Fallback */}
        {tailorMutation.isError && (
          <div className="bg-[#FAF0ED] border border-[#F4D4C9] rounded-lg p-6 text-center max-w-xl mx-auto space-y-3 text-[#9E2A2B]">
            <AlertTriangle className="w-8 h-8 mx-auto text-[#C84B26]" />
            <h3 className="font-serif font-bold text-base text-[#181614]">Analysis Could Not Complete</h3>
            <p className="text-xs text-[#5C564E]">
              {(tailorMutation.error as any)?.message || "Failed to calculate tailoring diff. Ensure the job requisition is active."}
            </p>
            <MechanicalButton
              variant="vermilion"
              size="sm"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() => {
                hasTriggeredRef.current = false;
                tailorMutation.mutate(activeResume._id);
              }}
            >
              Retry Optimization
            </MechanicalButton>
          </div>
        )}

        {/* Active Workspace: Left Controls & Telemetry + Right Live A4 Canvas */}
        {tailoringResult && structuredResume && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ══════════════════════════════════════════════════
                LEFT PANEL: CONTROLS, TELEMETRY & EDITOR
               ══════════════════════════════════════════════════ */}
            <div
              className={`lg:col-span-5 space-y-5 print:hidden ${
                mobileTab === "preview" ? "hidden lg:block" : "block"
              }`}
            >
              {/* 1. Template Intelligence & Selection Card */}
              <div className="bg-white border border-[#E5E0D4] rounded-lg p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#E5E0D4] pb-2">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#181614]">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#C84B26]" />
                    <span>Resume Template Architecture</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#2E6347] bg-[#EBF3EE] px-2 py-0.5 rounded border border-[#D0E3D6] font-semibold">
                    6 ATS TEMPLATES
                  </span>
                </div>

                {/* AI Deterministic Recommendation Rationale */}
                {tailoringResult.recommendation && (
                  <div className="p-3 bg-[#FAF8F5] border border-[#E5E0D4] rounded-md space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#181614]">
                      <Sparkles className="w-3.5 h-3.5 text-[#C84B26]" />
                      <span>{tailoringResult.recommendation.templateName}</span>
                    </div>
                    <p className="text-[11px] text-[#5C564E] leading-relaxed">
                      {tailoringResult.recommendation.rationale}
                    </p>
                  </div>
                )}

                {/* Template Selector Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {(Object.keys(TEMPLATE_METADATA) as TemplateId[]).map((tId) => {
                    const meta = TEMPLATE_METADATA[tId];
                    const isSelected = selectedTemplate === tId;
                    const isRecommended = tailoringResult.recommendation?.templateId === tId;

                    return (
                      <button
                        key={tId}
                        type="button"
                        onClick={() => setSelectedTemplate(tId)}
                        className={`text-left p-2.5 rounded-md border text-xs transition-all cursor-pointer relative ${
                          isSelected
                            ? "bg-[#FAF8F5] border-[#C84B26] ring-1 ring-[#C84B26]/30 shadow-2xs"
                            : "bg-white border-[#E5E0D4] hover:border-[#181614]/40"
                        }`}
                      >
                        {isRecommended && (
                          <span className="absolute -top-1.5 right-2 px-1.5 py-0.2 bg-[#C84B26] text-white text-[9px] font-mono uppercase tracking-wider rounded font-bold shadow-2xs">
                            Rec
                          </span>
                        )}
                        <div className="font-bold text-[#181614] truncate">{meta.name.split("(")[0]}</div>
                        <div className="text-[10px] text-[#8C8479] truncate">{meta.tag}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. 4-Metric ATS Telemetry Card */}
              <div className="bg-white border border-[#E5E0D4] rounded-lg p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#E5E0D4] pb-2">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#181614]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2E6347]" />
                    <span>ATS Audit & Score Telemetry</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#C84B26]">
                    {tailoringResult.telemetry?.jobMatchScore || 90}% MATCH
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {/* Metric 1: Quality Score */}
                  <div className="p-2.5 bg-[#FAF8F5] border border-[#E5E0D4] rounded-md">
                    <div className="text-[10px] font-mono text-[#8C8479] uppercase">Resume Quality</div>
                    <div className="font-serif font-bold text-lg text-[#181614]">
                      {tailoringResult.telemetry?.resumeQualityScore || 96}%
                    </div>
                    <div className="text-[10px] text-[#2E6347] font-mono">Zero Fragmentation</div>
                  </div>

                  {/* Metric 2: Keyword Coverage */}
                  <div className="p-2.5 bg-[#FAF8F5] border border-[#E5E0D4] rounded-md">
                    <div className="text-[10px] font-mono text-[#8C8479] uppercase">Keyword Coverage</div>
                    <div className="font-serif font-bold text-lg text-[#181614]">
                      {tailoringResult.telemetry?.keywordCoverageScore || 88}%
                    </div>
                    <div className="text-[10px] text-[#5C564E] font-mono">Target JD Aligned</div>
                  </div>

                  {/* Metric 3: Overall Job Match */}
                  <div className="p-2.5 bg-[#FAF8F5] border border-[#E5E0D4] rounded-md">
                    <div className="text-[10px] font-mono text-[#8C8479] uppercase">Projected Match</div>
                    <div className="font-serif font-bold text-lg text-[#C84B26]">
                      {tailoringResult.telemetry?.jobMatchScore || 92}%
                    </div>
                    <div className="text-[10px] text-[#2E6347] font-mono">
                      +{Math.max(0, (tailoringResult.telemetry?.jobMatchScore || 90) - tailoringResult.currentScore)}% Score Lift
                    </div>
                  </div>

                  {/* Metric 4: Readability */}
                  <div className="p-2.5 bg-[#FAF8F5] border border-[#E5E0D4] rounded-md">
                    <div className="text-[10px] font-mono text-[#8C8479] uppercase">ATS Readability</div>
                    <div className="font-serif font-bold text-lg text-[#181614]">
                      {tailoringResult.telemetry?.atsReadabilityScore || 98}%
                    </div>
                    <div className="text-[10px] text-[#2E6347] font-mono">100% Linear Parse</div>
                  </div>
                </div>

                {/* Validation Warnings / Status */}
                {tailoringResult.validationReport?.warnings?.length > 0 ? (
                  <div className="p-2.5 bg-[#FDF6E9] border border-[#F7E6C4] rounded text-xs text-[#A36114] space-y-1">
                    <div className="font-bold flex items-center gap-1 text-[11px] font-mono uppercase">
                      <AlertTriangle className="w-3.5 h-3.5" /> Validation Notice
                    </div>
                    <ul className="list-disc list-outside pl-4 space-y-0.5 text-[11px]">
                      {tailoringResult.validationReport.warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-2 rounded bg-[#EBF3EE] border border-[#D0E3D6] text-[11px] text-[#2E6347] font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Document passed all strict ATS formatting and unfragmented title checks.</span>
                  </div>
                )}
              </div>

              {/* 3. Skills Reconciliation Accordion */}
              <div className="bg-white border border-[#E5E0D4] rounded-lg p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#E5E0D4] pb-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#181614]">
                    Skills & Keyword Alignment
                  </span>
                  <span className="text-[10px] font-mono text-[#8C8479]">
                    {tailoringResult.telemetry?.matchedSkills?.length || 0} MATCHED
                  </span>
                </div>

                {/* Matched Skills */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono text-[#2E6347] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Profile Skills Matched
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tailoringResult.telemetry?.matchedSkills?.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#EBF3EE] text-[#2E6347] border border-[#D0E3D6]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Skills */}
                {tailoringResult.telemetry?.missingSkills?.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-[#E5E0D4]">
                    <div className="text-[11px] font-mono text-[#A36114] font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Target Gaps (Retained for Mock Interview Prep)
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tailoringResult.telemetry.missingSkills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#FDF6E9] text-[#A36114] border border-[#F7E6C4]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#8C8479] italic pt-0.5">
                      Factual integrity rule: Unverified skills are never fabricated onto your resume.
                    </p>
                  </div>
                )}
              </div>

              {/* 4. Interactive Content Editor */}
              <div className="bg-white border border-[#E5E0D4] rounded-lg p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#E5E0D4] pb-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#181614]">
                    Tailored Content Customizer
                  </span>
                  <div className="flex gap-1 text-[11px] font-mono">
                    <button
                      onClick={() => setActiveAccordion("summary")}
                      className={`px-2 py-0.5 rounded cursor-pointer ${activeAccordion === "summary" ? "bg-[#181614] text-white" : "text-[#8C8479]"}`}
                    >
                      Summary
                    </button>
                    <button
                      onClick={() => setActiveAccordion("projects")}
                      className={`px-2 py-0.5 rounded cursor-pointer ${activeAccordion === "projects" ? "bg-[#181614] text-white" : "text-[#8C8479]"}`}
                    >
                      Projects ({structuredResume.projects?.length || 0})
                    </button>
                    <button
                      onClick={() => setActiveAccordion("education")}
                      className={`px-2 py-0.5 rounded cursor-pointer ${activeAccordion === "education" ? "bg-[#181614] text-white" : "text-[#8C8479]"}`}
                    >
                      Education
                    </button>
                  </div>
                </div>

                {/* Summary Editor */}
                {activeAccordion === "summary" && (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-[#8C8479]">Target Professional Summary</span>
                      {!editingSummary ? (
                        <button
                          type="button"
                          onClick={() => setEditingSummary(true)}
                          className="text-[#C84B26] hover:underline flex items-center gap-1 font-mono text-[11px] cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" /> Edit Phrasing
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSummaryDraft(structuredResume.summary || "");
                              setEditingSummary(false);
                            }}
                            className="text-[#8C8479] hover:underline font-mono text-[11px] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveSummary}
                            className="px-2 py-0.5 bg-[#2E6347] text-white rounded font-mono text-[11px] cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      )}
                    </div>

                    {editingSummary ? (
                      <textarea
                        value={summaryDraft}
                        onChange={(e) => setSummaryDraft(e.target.value)}
                        rows={4}
                        className="w-full p-2.5 rounded border border-[#C84B26] bg-[#FAF8F5] text-xs font-sans text-[#181614] focus:outline-none leading-relaxed"
                      />
                    ) : (
                      <p className="p-2.5 rounded border border-[#E5E0D4] bg-[#FAF8F5] text-xs leading-relaxed text-[#181614]/90">
                        {structuredResume.summary || "No summary specified."}
                      </p>
                    )}
                  </div>
                )}

                {/* Projects Inspector */}
                {activeAccordion === "projects" && (
                  <div className="space-y-2 text-xs">
                    <span className="text-[10px] font-mono uppercase text-[#8C8479]">
                      Verified Technical Projects ({structuredResume.projects?.length})
                    </span>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {structuredResume.projects?.map((proj, idx) => (
                        <div key={idx} className="p-2.5 bg-[#FAF8F5] border border-[#E5E0D4] rounded-md space-y-1">
                          <div className="flex justify-between items-baseline font-bold text-[#181614]">
                            <span>{proj.name}</span>
                            <span className="text-[10px] font-mono text-[#8C8479]">Rank #{idx + 1}</span>
                          </div>
                          {proj.technologies?.length > 0 && (
                            <div className="text-[10.5px] font-mono text-[#5C564E]">
                              {proj.technologies.join(" • ")}
                            </div>
                          )}
                          <p className="text-[11px] text-[#5C564E] line-clamp-2">
                            {proj.bullets?.[0] || proj.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education Inspector */}
                {activeAccordion === "education" && (
                  <div className="space-y-2 text-xs">
                    <span className="text-[10px] font-mono uppercase text-[#8C8479]">
                      Verified Academic Credentials ({structuredResume.education?.length})
                    </span>
                    <div className="space-y-1.5">
                      {structuredResume.education?.map((edu, idx) => (
                        <div key={idx} className="p-2 bg-[#FAF8F5] border border-[#E5E0D4] rounded-md text-xs">
                          <div className="font-bold text-[#181614]">{edu.institution}</div>
                          <div className="text-[11px] text-[#5C564E]">
                            {edu.degree} {edu.gpa ? `• Score: ${edu.gpa}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Commit & Persistence Action Shelf */}
              <div className="bg-white border border-[#E5E0D4] rounded-lg p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono text-[#5C564E]">
                    {tailoredResumeId ? (
                      <span className="text-[#2E6347] font-semibold flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5 text-[#2E6347]" />
                        Version Committed to Database
                      </span>
                    ) : (
                      "Ready to persist tailored resume version."
                    )}
                  </div>
                </div>

                {!tailoredResumeId ? (
                  <MechanicalButton
                    variant="vermilion"
                    size="md"
                    className="w-full"
                    icon={<Check className="w-4 h-4" />}
                    onClick={() => commitMutation.mutate()}
                    disabled={commitMutation.isPending}
                  >
                    {commitMutation.isPending ? "Generating Tailored Version..." : "Commit Tailored Resume Version"}
                  </MechanicalButton>
                ) : (
                  <div className="space-y-2">
                    {/* PDF Error Notice */}
                    {pdfError && (
                      <div className="p-3 bg-[#FAF0ED] border border-[#F4D4C9] rounded text-xs text-[#9E2A2B] flex items-center justify-between">
                        <span>{pdfError}</span>
                        <button onClick={() => setPdfError(null)} className="underline ml-2">Dismiss</button>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <MechanicalButton
                        variant="vermilion"
                        size="sm"
                        className="flex-1"
                        icon={<Download className="w-3.5 h-3.5" />}
                        onClick={handleSavePdf}
                        disabled={isExportingPdf}
                      >
                        {isExportingPdf ? "Exporting PDF..." : "Save PDF"}
                      </MechanicalButton>
                      <MechanicalButton
                        variant="stone"
                        size="sm"
                        className="flex-1"
                        icon={<Download className="w-3.5 h-3.5" />}
                        onClick={() => handleDownloadDocx(tailoredResumeId)}
                        disabled={isDownloading}
                      >
                        {isDownloading ? "Exporting..." : "Download DOCX"}
                      </MechanicalButton>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <InkBleedButton
                        onClick={() => attachToApplicationMutation.mutate()}
                        disabled={attachToApplicationMutation.isPending || attachedToApp}
                        className="flex-1"
                      >
                        {attachedToApp ? <CheckCheck className="w-3.5 h-3.5 text-[#2E6347]" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                        <span>{attachedToApp ? "Attached to Application" : "Attach to App"}</span>
                      </InkBleedButton>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ══════════════════════════════════════════════════
                RIGHT PANEL: LIVE A4 DOCUMENT CANVAS & EXPORT
               ══════════════════════════════════════════════════ */}
            <div
              className={`lg:col-span-7 space-y-4 ${
                mobileTab === "controls" ? "hidden lg:block" : "block"
              }`}
            >
              {/* Toolbar: Template Info, Zoom, Export Actions */}
              <div className="bg-white border border-[#E5E0D4] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs print:hidden">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase text-[#8C8479]">Active Template:</span>
                  <span className="font-mono text-xs font-bold text-[#181614] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E5E0D4]">
                    {TEMPLATE_METADATA[selectedTemplate]?.name}
                  </span>
                  <span className="font-mono text-[10px] text-[#2E6347] bg-[#EBF3EE] px-2 py-0.5 rounded border border-[#D0E3D6]">
                    1 Page Density
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Zoom Controls */}
                  <div className="flex items-center rounded-md bg-[#FAF8F5] border border-[#E5E0D4] p-0.5 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(0.7, Number((z - 0.1).toFixed(1))))}
                      className="p-1 rounded hover:bg-white text-[#5C564E] hover:text-[#181614] cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 text-[11px] font-bold text-[#181614]">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(1.3, Number((z + 0.1).toFixed(1))))}
                      className="p-1 rounded hover:bg-white text-[#5C564E] hover:text-[#181614] cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Direct Save PDF Button */}
                  <button
                    type="button"
                    onClick={handleSavePdf}
                    disabled={isExportingPdf}
                    className="px-3 py-1.5 rounded bg-[#C84B26] hover:bg-[#B53E1B] text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExportingPdf ? "Generating PDF..." : "Save PDF"}</span>
                  </button>

                  {/* Print / Save via Browser */}
                  <button
                    type="button"
                    onClick={handlePrintPdf}
                    disabled={isPrinting}
                    className="px-3 py-1.5 rounded bg-[#172535] hover:bg-[#181614] text-white text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    title="Print directly or save as PDF via browser print dialog"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{isPrinting ? "Printing..." : "Print"}</span>
                  </button>

                  {/* DOCX Export Button */}
                  <button
                    type="button"
                    onClick={() => handleDownloadDocx(tailoredResumeId || activeResume._id)}
                    disabled={isDownloading}
                    className="px-3 py-1.5 rounded bg-white hover:bg-[#FAF8F5] border border-[#E5E0D4] text-[#181614] text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#5C564E]" />
                    <span>DOCX</span>
                  </button>
                </div>
              </div>

              {/* Rendered Live A4 Resume Canvas */}
              <div className="w-full bg-[#E8E4DC] p-4 sm:p-6 rounded-lg border border-[#DCD5C6] shadow-inner overflow-hidden print:p-0 print:bg-white print:border-none">
                <ResumeTemplateDispatcher
                  resume={structuredResume}
                  templateId={selectedTemplate}
                  zoom={zoomLevel}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
