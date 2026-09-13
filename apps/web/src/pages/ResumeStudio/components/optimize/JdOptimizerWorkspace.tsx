import React, { useState } from "react";
import {
  Sparkles, Check, X, Edit3, ArrowRight, AlertTriangle,
  CheckCircle2, RefreshCw, FileText
} from "lucide-react";
import { ApiClient } from "../../../../lib/api";

interface JdOptimizerWorkspaceProps {
  resume: any;
  onUpdateResume: (updatedResume: any) => void;
  initialMatchData?: any;
}

export const JdOptimizerWorkspace: React.FC<JdOptimizerWorkspaceProps> = ({
  resume,
  onUpdateResume,
  initialMatchData,
}) => {
  const [jobDescription, setJobDescription] = useState<string>("");
  const [targetTitle, setTargetTitle] = useState<string>(
    initialMatchData?.targetTitle || resume?.targetRole || ""
  );
  const [optimizing, setOptimizing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [diffs, setDiffs] = useState<any[]>([]);
  const [decisionMap, setDecisionMap] = useState<Record<number, "accepted" | "rejected" | "pending">>({});
  const [editedTextMap, setEditedTextMap] = useState<Record<number, string>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGenerateTailoring = async () => {
    if (!resume?._id) return;
    if (!jobDescription.trim()) {
      setError("Please provide the Job Description to tailor your resume against.");
      return;
    }

    setOptimizing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await ApiClient.tailorResume(resume._id, {
        jobDescription,
        targetTitle,
      });

      const proposedDiffs = res?.tailoring?.diffs || res?.diffs || [];
      setDiffs(proposedDiffs);

      // Initialize all as pending
      const initDecisions: Record<number, "accepted" | "rejected" | "pending"> = {};
      proposedDiffs.forEach((_: any, idx: number) => {
        initDecisions[idx] = "pending";
      });
      setDecisionMap(initDecisions);
    } catch (err: any) {
      setError(err.message || "Failed to generate tailored suggestions.");
    } finally {
      setOptimizing(false);
    }
  };

  const setDecision = (index: number, status: "accepted" | "rejected") => {
    setDecisionMap((prev) => ({ ...prev, [index]: status }));
  };

  const handleApplyChanges = async () => {
    if (!resume?._id) return;
    const acceptedDiffs = diffs
      .map((d, index) => {
        if (decisionMap[index] === "accepted") {
          return {
            ...d,
            suggestedText: editedTextMap[index] ?? d.suggestedText ?? d.after,
          };
        }
        return null;
      })
      .filter(Boolean);

    if (acceptedDiffs.length === 0) {
      setError("Please accept at least one suggested change before applying.");
      return;
    }

    setApplying(true);
    setError(null);
    try {
      const res = await ApiClient.applyTailoring(resume._id, {
        appliedDiffs: acceptedDiffs,
        targetRole: targetTitle || undefined,
      });

      if (res?.resume) {
        onUpdateResume(res.resume);
      }
      setSuccessMessage(`Successfully applied ${acceptedDiffs.length} tailored enhancement(s)!`);
      setDiffs([]);
    } catch (err: any) {
      setError(err.message || "Failed to apply tailored changes.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-semibold text-slate-100">Job Description Resume Optimizer</h2>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          Generate targeted, evidence-backed improvements to align your bullets and summary with the job requirements. Every suggestion is reviewable with Before/After diffs.
        </p>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-sm text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Target Role Title
          </label>
          <input
            type="text"
            value={targetTitle}
            onChange={(e) => setTargetTitle(e.target.value)}
            placeholder="e.g. Lead Frontend Architect"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Job Description Requirements
          </label>
          <textarea
            rows={4}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste target job description to guide the optimization..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleGenerateTailoring}
            disabled={optimizing}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${optimizing ? "animate-spin" : ""}`} />
            {optimizing ? "Generating Optimization Diffs..." : "Generate Optimization Diffs"}
          </button>
        </div>
      </div>

      {/* Diffs List */}
      {diffs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Proposed Changes ({diffs.length})
            </h3>
            <div className="text-xs text-slate-400">
              Accepted: {Object.values(decisionMap).filter((v) => v === "accepted").length} / {diffs.length}
            </div>
          </div>

          {diffs.map((diff, idx) => {
            const decision = decisionMap[idx] || "pending";
            const originalText = diff.originalText || diff.before || "";
            const suggestedText = editedTextMap[idx] ?? (diff.suggestedText || diff.after || "");
            const reason = diff.reason || diff.rationale || "Improves alignment with job requirements using existing background.";

            return (
              <div
                key={idx}
                className={`bg-slate-900/60 border rounded-xl p-5 space-y-3 transition-colors ${
                  decision === "accepted"
                    ? "border-emerald-500/40 bg-emerald-950/10"
                    : decision === "rejected"
                    ? "border-slate-800/40 opacity-50"
                    : "border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                    {diff.section || "Experience Bullet"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDecision(idx, "accepted")}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                        decision === "accepted"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => setDecision(idx, "rejected")}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                        decision === "rejected"
                          ? "bg-rose-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => setEditingIndex(editingIndex === idx ? null : idx)}
                      className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                      title="Edit text"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Diff View */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg">
                    <div className="font-semibold text-rose-400 mb-1">CURRENT</div>
                    <div className="text-slate-300 leading-relaxed font-sans">{originalText}</div>
                  </div>

                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                    <div className="font-semibold text-emerald-400 mb-1">SUGGESTED</div>
                    {editingIndex === idx ? (
                      <textarea
                        rows={3}
                        value={suggestedText}
                        onChange={(e) => setEditedTextMap({ ...editedTextMap, [idx]: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 text-xs focus:outline-none"
                      />
                    ) : (
                      <div className="text-slate-200 leading-relaxed font-sans">{suggestedText}</div>
                    )}
                  </div>
                </div>

                {/* Rationale */}
                <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  <strong className="text-slate-300">Reason:</strong> {reason}
                </div>
              </div>
            );
          })}

          <div className="flex justify-end pt-4">
            <button
              onClick={handleApplyChanges}
              disabled={applying}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {applying ? "Applying Enhancements..." : "Apply Accepted Changes to Resume"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
