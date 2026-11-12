import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "../lib/api";
import { ArrowLeft, Sparkles, AlertTriangle, CheckCircle, ChevronRight, Check, X, ShieldAlert, RefreshCw } from "lucide-react";

export default function TailorResumePage() {
  const { id: jobId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasTriggeredRef = useRef(false);

  // We query resumes and pick the active one
  const { data: resumes, isLoading: isResumesLoading } = useQuery({
    queryKey: ["resumes"],
    queryFn: () => ApiClient.getResumes()
  });

  const activeResume = Array.isArray(resumes)
    ? resumes.find((r: any) => r.status === "active") || resumes[0]
    : null;

  // State to track tailoring run
  const [runId, setRunId] = useState<string | null>(null);

  const { data: run, refetch: refetchRun } = useQuery({
    queryKey: ["tailoringRun", runId],
    queryFn: () => ApiClient.getTailoringRun(runId!),
    enabled: !!runId,
    refetchInterval: (query: any) => (query?.state?.data?.status === "DRAFT" || query?.state?.data?.status === "UNDER_REVIEW" ? false : 2000)
  });

  const planMutation = useMutation({
    mutationFn: (body: { resumeVersionId: string; jobId: string }) => ApiClient.generateTailoringPlan(body),
    onSuccess: (data) => {
      setRunId(data._id);
    }
  });

  const executeMutation = useMutation({
    mutationFn: () => ApiClient.executeTailoring(runId!),
    onSuccess: () => {
      refetchRun();
    }
  });

  const approveMutation = useMutation({
    mutationFn: () => ApiClient.approveTailoringRun(runId!),
    onSuccess: () => {
      navigate(`/resume`); // Go back to resume studio or somewhere to download
    }
  });

  // Automatically start plan generation once we have a resume without looping
  useEffect(() => {
    if (
      !hasTriggeredRef.current &&
      activeResume &&
      jobId &&
      !runId &&
      !planMutation.isPending &&
      !planMutation.isSuccess &&
      !planMutation.isError
    ) {
      hasTriggeredRef.current = true;
      const targetVersionId = activeResume.activeVersionId || activeResume.versionId || activeResume._id;
      planMutation.mutate({ resumeVersionId: targetVersionId, jobId });
    }
  }, [activeResume, jobId, runId, planMutation.isPending, planMutation.isSuccess, planMutation.isError]);

  if (isResumesLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mr-3" />
        Loading resume context...
      </div>
    );
  }

  if (!activeResume) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">No Resume Found</h2>
        <p className="text-sm text-slate-400">Please upload or create a resume in the Resume Studio before tailoring for a job.</p>
        <div className="flex justify-center gap-3 pt-4">
          <button onClick={() => navigate("/resume")} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Go to Resume Studio
          </button>
          <button onClick={() => navigate(`/jobs/${jobId}`)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors">
            Back to Job
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 text-slate-300">
      <button onClick={() => navigate(`/jobs/${jobId}`)} className="flex items-center gap-2 text-xs font-semibold hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Job
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">AI Resume Tailoring</h1>
          <p className="text-sm text-slate-400">Deterministic, zero-hallucination tailoring for ATS alignment.</p>
        </div>
      </div>

      {planMutation.isError && !run && (
        <div className="p-8 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Tailoring Plan Generation Failed</h2>
          <p className="text-sm text-rose-300/80">
            {(planMutation.error as any)?.message || "Unable to generate tailoring plan. Please ensure the job details and your resume are accessible."}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => {
                hasTriggeredRef.current = false;
                planMutation.reset();
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            <button
              onClick={() => navigate(`/jobs/${jobId}`)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold"
            >
              Back to Job
            </button>
          </div>
        </div>
      )}

      {!run && planMutation.isPending && (
        <div className="p-10 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
          <h2 className="text-white font-bold">Analyzing Job Requirements...</h2>
          <p className="text-sm text-slate-400">Mapping your verified skills to the job description.</p>
        </div>
      )}

      {run?.status === "DRAFT" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gaps Panel */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Evidence Gaps (Will not be added)
              </h2>
              <div className="space-y-2">
                {run.plan?.evidenceMap && Object.entries(run.plan.evidenceMap).filter(([_, v]: any) => v.status === "MISSING").map(([skill, data]: any) => (
                  <div key={skill} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-sm flex justify-between">
                    <span className="font-semibold text-slate-300">{skill}</span>
                    <span className="text-xs text-slate-500">{data.reason}</span>
                  </div>
                ))}
                {(!run.plan?.evidenceMap || Object.entries(run.plan.evidenceMap).filter(([_, v]: any) => v.status === "MISSING").length === 0) && (
                  <div className="text-sm text-slate-400">No missing requirements!</div>
                )}
              </div>
            </div>

            {/* Verified Panel */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Verified Match (Will be highlighted)
              </h2>
              <div className="flex flex-wrap gap-2">
                {run.plan?.evidenceMap && Object.entries(run.plan.evidenceMap).filter(([_, v]: any) => v.status === "VERIFIED").map(([skill]: any) => (
                  <span key={skill} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => executeMutation.mutate()}
              disabled={executeMutation.isPending}
              className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {executeMutation.isPending ? "Tailoring..." : "Approve Plan & Tailor"} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {run?.status === "REJECTED" && (
        <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300">
          <h2 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5" /> Truth Gate Failed
          </h2>
          <p className="text-sm">The AI proposed changes that violated the integrity policy. Run rejected.</p>
          {run.qualityGate?.issues?.map((i: string, idx: number) => (
            <div key={idx} className="mt-2 text-xs opacity-80">• {i}</div>
          ))}
          <button onClick={() => setRunId(null)} className="mt-4 px-4 py-2 bg-red-500/20 rounded-lg text-sm font-bold hover:bg-red-500/30">Retry</button>
        </div>
      )}

      {run?.status === "UNDER_REVIEW" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
            <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5" /> Truth Gate Passed
            </h2>
            <p className="text-sm text-emerald-300/80">No fabricated metrics or skills were detected in the proposal.</p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
            <h3 className="text-sm font-bold text-white mb-4">Proposed Summary</h3>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
              {run.aiProposal?.summary?.proposedText}
            </div>
            <p className="mt-3 text-xs text-indigo-400">Reasoning: {run.aiProposal?.summary?.reason}</p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
            <h3 className="text-sm font-bold text-white mb-4">Proposed Experience Adjustments</h3>
            <div className="space-y-4">
              {run.aiProposal?.experience?.map((exp: any, i: number) => (
                <div key={i} className="space-y-2">
                  {exp.bullets.map((b: any, j: number) => (
                    <div key={j} className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-sm">
                      <div className="text-slate-300">{b.proposedText}</div>
                      <div className="text-xs text-slate-500 mt-2 flex gap-2 flex-wrap">
                        {b.matchedRequirements?.map((r: string) => (
                          <span key={r} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20">{r}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => setRunId(null)}
              className="py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center gap-2 transition-colors"
            >
              <X className="w-4 h-4" /> Reject
            </button>
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> Approve & Render
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
