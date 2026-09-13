import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "../lib/api";
import { ArrowLeft, Sparkles, AlertTriangle, CheckCircle, ChevronRight, Check, X, ShieldAlert } from "lucide-react";

export default function TailorResumePage() {
  const { id: jobId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // We assume the user has a default canonical resume version for simplicity.
  // In a real flow, they'd pick one, but let's query their resumes and pick the active one.
  const { data: resumes } = useQuery({
    queryKey: ["resumes"],
    queryFn: () => ApiClient.getResumes()
  });

  const activeResume = resumes?.find((r: any) => r.status === "active") || resumes?.[0];
  const resumeVersionId = activeResume?.version; // Real implementation might use a dedicated version ID endpoint

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

  // Automatically start plan generation once we have a resume
  useEffect(() => {
    if (activeResume && jobId && !runId && !planMutation.isPending && !planMutation.isSuccess) {
      // Just a stub for version ID - in reality, would be a real ObjectID
      planMutation.mutate({ resumeVersionId: activeResume._id, jobId });
    }
  }, [activeResume, jobId, runId, planMutation]);

  if (!activeResume) return <div className="p-10 text-white">Loading resume context...</div>;

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
                {Object.entries(run.plan.evidenceMap).filter(([_, v]: any) => v.status === "MISSING").map(([skill, data]: any) => (
                  <div key={skill} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-sm flex justify-between">
                    <span className="font-semibold text-slate-300">{skill}</span>
                    <span className="text-xs text-slate-500">{data.reason}</span>
                  </div>
                ))}
                {Object.entries(run.plan.evidenceMap).filter(([_, v]: any) => v.status === "MISSING").length === 0 && (
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
                {Object.entries(run.plan.evidenceMap).filter(([_, v]: any) => v.status === "VERIFIED").map(([skill]: any) => (
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

          {/* Just showing the raw output for simplicity in this artifact, would be a rich diff viewer */}
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
