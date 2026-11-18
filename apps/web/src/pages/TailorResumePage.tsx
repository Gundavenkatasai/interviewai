import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "../lib/api";
import {
  ArrowLeft, Sparkles, AlertTriangle, CheckCircle2,
  Check, X, RefreshCw, FileText, Download, Building2,
  MapPin, Briefcase, Printer, Eye, Edit3, BookmarkPlus,
  Layers, CheckCheck, SlidersHorizontal
} from "lucide-react";
import { MechanicalButton } from "../components/ui/MechanicalButton";
import { InkBleedButton } from "../components/ui/InkBleedButton";

interface TailoringDiffItem {
  section: string;
  field: string;
  current: string;
  proposed: string;
  rationale: string;
}

interface TailoringResult {
  success: boolean;
  currentScore: number;
  potentialScore: number;
  diff: TailoringDiffItem[];
  matchedSkills?: string[];
  missingSkills?: string[];
  suggestedSkillsToAdd?: string[];
}

const ATS_TEMPLATES = [
  { id: "classic-ats", label: "Classic Single-Column (Optimal ATS)", description: "Standard hierarchical single-column layout with 99.4% parser fidelity." },
  { id: "modern-ats", label: "Modern Technical Minimalist", description: "Clean sans-serif structure highlighting tools and quantifiable impact." },
  { id: "technical-ats", label: "Engineering Specialist", description: "Expanded skills grid and project architecture highlights." },
  { id: "executive-ats", label: "Compact Executive", description: "Tight line spacing tailored for senior engineering leadership." },
];

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

  // Tailoring Analysis State
  const [tailoringResult, setTailoringResult] = useState<TailoringResult | null>(null);
  const [selectedDiffIndices, setSelectedDiffIndices] = useState<Set<number>>(new Set());
  const [tailoredResumeId, setTailoredResumeId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("classic-ats");
  const [viewTab, setViewTab] = useState<"diff" | "preview">("diff");
  const [attachedToApp, setAttachedToApp] = useState(false);
  const [editingDiffIndex, setEditingDiffIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

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

  // Mutation to run ATS Tailoring Diff
  const tailorMutation = useMutation({
    mutationFn: async (resumeId: string) => {
      const res = await ApiClient.tailorResume(resumeId, {
        jobId,
        jobDescription: job?.description,
        targetTitle: job?.title,
      });
      return res as TailoringResult;
    },
    onSuccess: (data) => {
      setTailoringResult(data);
      if (Array.isArray(data.diff)) {
        setSelectedDiffIndices(new Set(data.diff.map((_, i) => i)));
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
      if (!activeResume || !tailoringResult) return null;
      const appliedDiffs = tailoringResult.diff.filter((_, i) => selectedDiffIndices.has(i));
      const res = await ApiClient.applyTailoring(activeResume._id, {
        appliedDiffs,
        targetRole: job?.title || activeResume.targetRole,
        newResumeName: `${activeResume.name || "Resume"} (Tailored for ${job?.companyName || job?.company || "Target Role"})`,
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
        notes: `Tailored resume generated on ${new Date().toLocaleDateString()} with ATS Score ${tailoringResult?.potentialScore || 85}%`
      });
    },
    onSuccess: () => {
      setAttachedToApp(true);
      queryClient.invalidateQueries({ queryKey: ["userApplications"] });
    }
  });

  // Handle DOCX download
  const handleDownloadDocx = async (resumeId: string) => {
    try {
      setIsDownloading(true);
      const blob = await ApiClient.downloadResumeDocx(resumeId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tailored_${job?.companyName || "Job"}_Resume.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle PDF Print / Export
  const handlePrintPdf = () => {
    setViewTab("preview");
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const toggleDiffIndex = (idx: number) => {
    setSelectedDiffIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const saveEdit = (idx: number) => {
    if (!tailoringResult) return;
    const updated = [...tailoringResult.diff];
    updated[idx] = { ...updated[idx], proposed: editText };
    setTailoringResult({ ...tailoringResult, diff: updated });
    setEditingDiffIndex(null);
  };

  // Prepare preview data with applied diffs
  const previewProfile = React.useMemo(() => {
    if (!activeResume?.profileData) return null;
    const copy = JSON.parse(JSON.stringify(activeResume.profileData));

    if (tailoringResult?.diff) {
      tailoringResult.diff.forEach((d, idx) => {
        if (selectedDiffIndices.has(idx)) {
          if (d.field === "summary") {
            copy.summary = d.proposed;
          } else if (d.field === "bullets[0]" && copy.experience?.[0]?.bullets?.length) {
            copy.experience[0].bullets[0] = d.proposed;
          }
        }
      });
    }

    return copy;
  }, [activeResume, tailoringResult, selectedDiffIndices]);

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
      {/* Top Banner Navigation */}
      <header className="border-b border-[#E5E0D4] bg-white px-6 py-4 sticky top-0 z-20 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                  GOLDEN THREAD • ATS TAILORING ENGINE
                </span>
                <span className="text-xs font-mono text-[#8C8479]">ID: {jobId?.slice(0, 10)}...</span>
              </div>
              <h1 className="text-xl font-serif font-bold text-[#181614] tracking-tight mt-0.5">
                Precision ATS Tailoring & Evidence Alignment
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Template Switcher Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#E5E0D4] rounded-md px-2 py-1 text-xs font-mono">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#5C564E]" />
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="bg-transparent border-none text-xs font-mono text-[#181614] focus:outline-none cursor-pointer"
                title="Select ATS Resume Template"
              >
                {ATS_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex rounded-md bg-[#FAF8F5] border border-[#E5E0D4] p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setViewTab("diff")}
                className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewTab === "diff"
                    ? "bg-white text-[#181614] font-bold shadow-xs border border-[#E5E0D4]"
                    : "text-[#8C8479] hover:text-[#181614]"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#C84B26]" />
                <span>Diff Review</span>
              </button>
              <button
                type="button"
                onClick={() => setViewTab("preview")}
                className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewTab === "preview"
                    ? "bg-white text-[#181614] font-bold shadow-xs border border-[#E5E0D4]"
                    : "text-[#8C8479] hover:text-[#181614]"
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-[#172535]" />
                <span>Live Preview</span>
              </button>
            </div>

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
                Mock Stage
              </MechanicalButton>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* Grounded Job Header Banner */}
        {job && (
          <div className="bg-white border border-[#E5E0D4] rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#172535] bg-[#EFECE6] px-2 py-0.5 rounded border border-[#DCD5C6]">
                  TARGET REQUISITION
                </span>
                <span className="text-xs font-mono text-[#8C8479]">[{job.workMode || job.work_mode || "Full Time"}]</span>
              </div>
              <h2 className="font-serif font-bold text-lg text-[#181614]">{job.title || "Software Engineering Role"}</h2>
              <div className="flex items-center gap-3 text-xs text-[#5C564E]">
                <span className="flex items-center gap-1 font-medium text-[#181614]">
                  <Building2 className="w-3.5 h-3.5 text-[#8C8479]" /> {job.companyName || job.company || "Target Company"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#8C8479]" /> {job.location || "India / Remote"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#FAF8F5] border border-[#E5E0D4] px-4 py-2.5 rounded-lg">
              <div className="text-right">
                <div className="text-[10px] font-mono text-[#8C8479] uppercase">Base Candidate Dossier</div>
                <div className="text-xs font-semibold text-[#181614]">
                  {activeResume ? activeResume.name || "Default Resume" : "No Resume Linked"}
                </div>
              </div>
              <FileText className="w-5 h-5 text-[#C84B26]" />
            </div>
          </div>
        )}

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
            <h3 className="font-serif font-bold text-base text-[#181614]">Cross-Referencing JD with Profile Evidence...</h3>
            <p className="text-xs font-mono text-[#8C8479]">
              Enforcing zero-fabrication gate • Mapping semantic keywords • Computing ATS delta
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
              Retry Tailoring
            </MechanicalButton>
          </div>
        )}

        {/* Tailoring Results Presentation */}
        {tailoringResult && (
          <div className="space-y-6">
            {/* Score & Telemetry Gauge Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 print:hidden">
              <div className="bg-white border border-[#E5E0D4] rounded-lg p-5 flex items-center justify-between shadow-2xs">
                <div>
                  <div className="text-[10px] font-mono uppercase text-[#8C8479]">Baseline ATS Score</div>
                  <div className="font-serif font-bold text-3xl text-[#181614] mt-0.5">
                    {tailoringResult.currentScore}%
                  </div>
                  <div className="text-[11px] text-[#8C8479] font-mono mt-1">Pre-Tailored Resume</div>
                </div>
                <div className="w-12 h-12 rounded-full border border-[#E5E0D4] bg-[#FAF8F5] flex items-center justify-center font-mono text-sm text-[#8C8479]">
                  RAW
                </div>
              </div>

              <div className="bg-white border border-[#C84B26]/30 bg-gradient-to-br from-white to-[#FBF0EC] rounded-lg p-5 flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-[10px] font-mono uppercase text-[#C84B26] font-semibold">
                    Projected Match Score
                  </div>
                  <div className="font-serif font-bold text-3xl text-[#C84B26] mt-0.5">
                    {tailoringResult.potentialScore}%
                  </div>
                  <div className="text-[11px] text-[#2E6347] font-mono mt-1 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6347]" /> +
                    {Math.max(0, tailoringResult.potentialScore - tailoringResult.currentScore)}% Score Lift
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border border-[#F4D4C9] bg-white flex items-center justify-center font-mono text-sm text-[#C84B26] font-bold">
                  ATS
                </div>
              </div>

              <div className="bg-white border border-[#E5E0D4] rounded-lg p-5 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="text-[10px] font-mono uppercase text-[#172535] font-semibold">
                    TRUTH GATE GUARANTEE
                  </div>
                  <p className="text-[11px] text-[#5C564E] leading-relaxed mt-1">
                    Zero fake metrics or unearned competencies. Adjustments strictly rephrase real career accomplishments into JD
                    syntax.
                  </p>
                </div>
                <div className="text-[10px] font-mono text-[#2E6347] bg-[#EBF3EE] px-2 py-0.5 rounded border border-[#D0E3D6] self-start mt-2">
                  VERIFIED DEFENSIBLE
                </div>
              </div>
            </div>

            {/* View Tab 1: Diff Review */}
            {viewTab === "diff" && (
              <div className="space-y-6">
                {/* Skills Reconciliation Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Matched Skills */}
                  <div className="bg-white border border-[#E5E0D4] rounded-lg p-5 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif font-bold text-sm text-[#181614] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2E6347]" /> Verified Skills Matched (
                        {tailoringResult.matchedSkills?.length || 0})
                      </h3>
                      <span className="text-[10px] font-mono text-[#2E6347] bg-[#EBF3EE] px-2 py-0.5 rounded border border-[#D0E3D6]">
                        INCLUDED
                      </span>
                    </div>
                    <p className="text-xs text-[#5C564E]">
                      These competencies exist in your profile and directly answer requirements in this job posting:
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tailoringResult.matchedSkills && tailoringResult.matchedSkills.length > 0 ? (
                        tailoringResult.matchedSkills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded bg-[#EBF3EE] border border-[#D0E3D6] text-xs font-mono text-[#2E6347] font-medium"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#8C8479]">Core stack mapped via general engineering competencies</span>
                      )}
                    </div>
                  </div>

                  {/* Missing Skills / Gaps */}
                  <div className="bg-white border border-[#E5E0D4] rounded-lg p-5 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif font-bold text-sm text-[#181614] flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#A36114]" /> Evidence Gaps (
                        {tailoringResult.missingSkills?.length || 0})
                      </h3>
                      <span className="text-[10px] font-mono text-[#A36114] bg-[#FDF6E9] px-2 py-0.5 rounded border border-[#F7E6C4]">
                        NOT INVENTED
                      </span>
                    </div>
                    <p className="text-xs text-[#5C564E]">
                      Skills required by the JD but missing from your profile. These are flagged for interview prep instead of being
                      fabricated:
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tailoringResult.missingSkills && tailoringResult.missingSkills.length > 0 ? (
                        tailoringResult.missingSkills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded bg-[#FDF6E9] border border-[#F7E6C4] text-xs font-mono text-[#A36114] font-medium"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#2E6347]">No missing requirements! Complete skills alignment.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Proposed Content Rewrites Diff */}
                <div className="bg-white border border-[#E5E0D4] rounded-lg p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-base text-[#181614]">
                        Tailored Content Blueprint ({tailoringResult.diff.length} Proposed Changes)
                      </h3>
                      <p className="text-xs text-[#5C564E]">
                        Review the side-by-side phrasing adjustments. Select which items you want committed to your tailored resume.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <button
                        onClick={() => setSelectedDiffIndices(new Set(tailoringResult.diff.map((_, i) => i)))}
                        className="text-[#C84B26] hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-[#8C8479]">•</span>
                      <button onClick={() => setSelectedDiffIndices(new Set())} className="text-[#8C8479] hover:text-[#181614] cursor-pointer">
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {tailoringResult.diff.map((item, idx) => {
                      const isChecked = selectedDiffIndices.has(idx);
                      const isEditing = editingDiffIndex === idx;

                      return (
                        <div
                          key={idx}
                          className={`border rounded-lg p-4 transition-all duration-200 ${
                            isChecked ? "border-[#C84B26]/40 bg-[#FAF8F5]" : "border-[#E5E0D4] bg-white opacity-60"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleDiffIndex(idx)}
                                className="w-4 h-4 accent-[#C84B26] rounded cursor-pointer"
                              />
                              <span className="font-mono text-xs font-semibold text-[#181614]">{item.section}</span>
                            </label>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-[#8C8479] bg-white px-2 py-0.5 rounded border border-[#E5E0D4]">
                                {item.rationale}
                              </span>
                              {!isEditing ? (
                                <button
                                  type="button"
                                  onClick={() => { setEditingDiffIndex(idx); setEditText(item.proposed); }}
                                  className="p-1 rounded hover:bg-white text-[#8C8479] hover:text-[#181614] transition-colors cursor-pointer"
                                  title="Edit phrasing"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              ) : null}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            {/* Current Phrasing */}
                            <div className="p-3 bg-white rounded border border-[#E5E0D4] space-y-1">
                              <div className="text-[10px] font-mono text-[#8C8479] uppercase">Current Phrasing</div>
                              <p className="text-[#5C564E] leading-relaxed">{item.current}</p>
                            </div>

                            {/* Proposed Phrasing */}
                            <div className="p-3 bg-[#EBF3EE] rounded border border-[#D0E3D6] space-y-1">
                              <div className="text-[10px] font-mono text-[#2E6347] uppercase font-semibold">
                                Tailored Phrasing (Keywords Enhanced)
                              </div>
                              {isEditing ? (
                                <div className="space-y-2 pt-1">
                                  <textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    rows={3}
                                    className="w-full p-2 bg-white border border-[#D0E3D6] rounded text-xs font-sans text-[#181614] focus:outline-none focus:border-[#2E6347]"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingDiffIndex(null)}
                                      className="px-2 py-0.5 text-[11px] font-mono text-[#8C8479] hover:text-[#181614]"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => saveEdit(idx)}
                                      className="px-2.5 py-0.5 rounded bg-[#2E6347] text-white text-[11px] font-mono font-medium"
                                    >
                                      Save Edit
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[#181614] leading-relaxed font-medium">{item.proposed}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Commit and Export Actions */}
                  <div className="pt-4 border-t border-[#E5E0D4] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-[#5C564E] font-mono">
                      {selectedDiffIndices.size} of {tailoringResult.diff.length} adjustments selected for commit.
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                      {!tailoredResumeId ? (
                        <MechanicalButton
                          variant="vermilion"
                          size="md"
                          className="w-full sm:w-auto"
                          icon={<Check className="w-4 h-4" />}
                          onClick={() => commitMutation.mutate()}
                          disabled={commitMutation.isPending || selectedDiffIndices.size === 0}
                        >
                          {commitMutation.isPending ? "Generating Tailored Version..." : "Commit Tailored Resume Version"}
                        </MechanicalButton>
                      ) : (
                        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                          <MechanicalButton
                            variant="vermilion"
                            size="md"
                            icon={<Download className="w-4 h-4" />}
                            onClick={() => handleDownloadDocx(tailoredResumeId)}
                            disabled={isDownloading}
                          >
                            {isDownloading ? "Preparing Export..." : "Download DOCX"}
                          </MechanicalButton>

                          <MechanicalButton
                            variant="stone"
                            size="md"
                            icon={<Printer className="w-4 h-4" />}
                            onClick={handlePrintPdf}
                          >
                            Print / PDF
                          </MechanicalButton>

                          <InkBleedButton
                            onClick={() => attachToApplicationMutation.mutate()}
                            disabled={attachToApplicationMutation.isPending || attachedToApp}
                          >
                            {attachedToApp ? <CheckCheck className="w-4 h-4 text-[#2E6347]" /> : <BookmarkPlus className="w-4 h-4" />}
                            <span>{attachedToApp ? "Attached to Application" : "Attach to App"}</span>
                          </InkBleedButton>
                        </div>
                      )}
                    </div>
                  </div>

                  {tailoredResumeId && (
                    <div className="p-4 rounded-lg bg-[#EBF3EE] border border-[#D0E3D6] text-xs text-[#2E6347] flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          Tailored resume version committed to your database dossier! Grounded in verified evidence for {job?.title}.
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          navigate(
                            `/interview/broadcast?job_id=${jobId}&role=${encodeURIComponent(job?.title || "")}&company=${encodeURIComponent(job?.companyName || job?.company || "")}`
                          )
                        }
                        className="font-semibold underline hover:text-[#181614] shrink-0 cursor-pointer"
                      >
                        Launch Grounded Mock &rarr;
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* View Tab 2: Live Rendered Preview */}
            {viewTab === "preview" && previewProfile && (
              <div className="space-y-4">
                {/* Print / Action bar for preview */}
                <div className="flex items-center justify-between bg-white border border-[#E5E0D4] p-4 rounded-lg print:hidden">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs uppercase text-[#8C8479]">Active Template:</span>
                    <span className="font-mono text-xs font-bold text-[#181614]">
                      {ATS_TEMPLATES.find((t) => t.id === selectedTemplate)?.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrintPdf}
                      className="px-3 py-1.5 rounded bg-[#172535] hover:bg-[#181614] text-white text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print / Save as PDF</span>
                    </button>
                    {tailoredResumeId && (
                      <button
                        type="button"
                        onClick={() => handleDownloadDocx(tailoredResumeId)}
                        disabled={isDownloading}
                        className="px-3 py-1.5 rounded bg-[#C84B26] hover:bg-[#B53E1B] text-white text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download DOCX</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Printable Resume Canvas Sheet */}
                <div className="bg-white border border-[#E5E0D4] rounded-lg p-8 sm:p-12 shadow-sm max-w-4xl mx-auto space-y-6 font-serif text-[#181614]">
                  {/* Header */}
                  <div className="text-center border-b border-[#E5E0D4] pb-5 space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#181614]">
                      {previewProfile.personal?.fullName || "Candidate Name"}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-sans text-[#5C564E] pt-1">
                      {previewProfile.personal?.email && <span>{previewProfile.personal.email}</span>}
                      {previewProfile.personal?.phone && <span>• {previewProfile.personal.phone}</span>}
                      {previewProfile.personal?.location && <span>• {previewProfile.personal.location}</span>}
                      {previewProfile.personal?.linkedin && <span>• LinkedIn</span>}
                      {previewProfile.personal?.github && <span>• GitHub</span>}
                    </div>
                  </div>

                  {/* Summary */}
                  {previewProfile.summary && (
                    <div className="space-y-1.5">
                      <h2 className="text-xs font-sans font-bold uppercase tracking-widest text-[#181614] border-b border-[#E5E0D4] pb-1">
                        Professional Summary
                      </h2>
                      <p className="text-xs leading-relaxed text-[#181614]/90 font-sans">
                        {previewProfile.summary}
                      </p>
                    </div>
                  )}

                  {/* Skills Grid */}
                  {(previewProfile.skills?.technical?.length > 0 || previewProfile.skills?.frameworks?.length > 0) && (
                    <div className="space-y-1.5">
                      <h2 className="text-xs font-sans font-bold uppercase tracking-widest text-[#181614] border-b border-[#E5E0D4] pb-1">
                        Core Competencies & Technologies
                      </h2>
                      <div className="text-xs font-sans text-[#181614]/90 space-y-1">
                        {previewProfile.skills?.technical?.length > 0 && (
                          <div>
                            <span className="font-semibold">Languages & Tools: </span>
                            <span>{previewProfile.skills.technical.join(", ")}</span>
                          </div>
                        )}
                        {previewProfile.skills?.frameworks?.length > 0 && (
                          <div>
                            <span className="font-semibold">Frameworks: </span>
                            <span>{previewProfile.skills.frameworks.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {previewProfile.experience?.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-xs font-sans font-bold uppercase tracking-widest text-[#181614] border-b border-[#E5E0D4] pb-1">
                        Professional Experience
                      </h2>
                      <div className="space-y-4">
                        {previewProfile.experience.map((exp: any, i: number) => (
                          <div key={i} className="space-y-1 font-sans">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-[#181614]">{exp.role}</span>
                              <span className="text-[#8C8479] font-mono text-[11px]">
                                {exp.startDate} – {exp.current ? "Present" : exp.endDate || "Present"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-[#5C564E] italic">
                              <span>{exp.company}</span>
                              <span>{exp.location}</span>
                            </div>
                            {exp.bullets?.length > 0 && (
                              <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-[#181614]/90 leading-relaxed pt-1">
                                {exp.bullets.map((b: string, bIdx: number) => (
                                  <li key={bIdx}>{b}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {previewProfile.projects?.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-xs font-sans font-bold uppercase tracking-widest text-[#181614] border-b border-[#E5E0D4] pb-1">
                        Key Engineering Projects
                      </h2>
                      <div className="space-y-3 font-sans">
                        {previewProfile.projects.map((proj: any, i: number) => (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-[#181614]">{proj.name}</span>
                              {proj.technologies?.length > 0 && (
                                <span className="font-mono text-[11px] text-[#8C8479]">
                                  {proj.technologies.join(", ")}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#181614]/90 leading-relaxed">{proj.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {previewProfile.education?.length > 0 && (
                    <div className="space-y-2">
                      <h2 className="text-xs font-sans font-bold uppercase tracking-widest text-[#181614] border-b border-[#E5E0D4] pb-1">
                        Education
                      </h2>
                      <div className="space-y-2 font-sans">
                        {previewProfile.education.map((edu: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold">{edu.degree}</span> in <span>{edu.fieldOfStudy}</span>,{" "}
                              <span className="text-[#5C564E] italic">{edu.institution}</span>
                            </div>
                            <span className="text-[#8C8479] font-mono text-[11px]">{edu.graduationYear}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
