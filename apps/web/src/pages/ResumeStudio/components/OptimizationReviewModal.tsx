import React, { useState } from "react";
import {
  Sparkles, CheckCircle2, XCircle, Edit3, ShieldAlert,
  ArrowRight, ShieldCheck, Check, AlertTriangle, Info,
  RotateCcw, FileText
} from "lucide-react";
import { IOptimizationProposal } from "../../../lib/api";

interface OptimizationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposals: IOptimizationProposal[];
  onApply: (selectedIds: string[], editedProposals: Record<string, string>) => void;
  isApplying: boolean;
  fileName?: string;
  isDocx?: boolean;
}

export const OptimizationReviewModal: React.FC<OptimizationReviewModalProps> = ({
  isOpen,
  onClose,
  proposals,
  onApply,
  isApplying,
  fileName = "Resume",
  isDocx = true
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(proposals.map((p) => p.id))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    setSelectedIds(new Set(proposals.map((p) => p.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleStartEdit = (id: string, currentText: string) => {
    setEditingId(id);
    if (editedTexts[id] === undefined) {
      setEditedTexts((prev) => ({ ...prev, [id]: currentText }));
    }
  };

  const handleSaveEdit = () => {
    setEditingId(null);
  };

  const handleResetEdit = (id: string, originalSuggested: string) => {
    setEditedTexts((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setEditingId(null);
  };

  const handleConfirmApply = () => {
    onApply(Array.from(selectedIds), editedTexts);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sparkles className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">AI Optimization Review</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  Format-Preserving
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Review grounded improvements for <span className="text-slate-300 font-medium">{fileName}</span>. No facts or metrics invented.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isApplying}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            &times;
          </button>
        </div>

        {/* Format Preservation Guarantee Banner */}
        <div className="px-6 py-3 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border-b border-orange-500/20 flex items-center gap-3 text-xs text-orange-300 shrink-0">
          <ShieldCheck className="h-4 w-4 text-orange-400 shrink-0" />
          <span>
            {isDocx ? (
              <strong>Original Format Master:</strong>
            ) : (
              <strong>Reconstructed Layout Notice:</strong>
            )}
            {" "}
            {isDocx
              ? "Your original fonts, margins, bullet styles, dates, and company names are preserved. Only approved bullet wording changes."
              : "For PDF uploads, text improvements will be applied to the export. Upload DOCX for 100% native run-level OOXML preservation."}
          </span>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              Selected: <strong className="text-white">{selectedIds.size}</strong> of {proposals.length} improvements
            </span>
            <span className="text-slate-600">|</span>
            <button
              onClick={selectAll}
              className="text-orange-400 hover:text-orange-300 font-medium transition"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="text-slate-400 hover:text-slate-300 font-medium transition"
            >
              Deselect All
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Info className="h-3.5 w-3.5 text-slate-500" />
            <span>Click &ldquo;Edit Wording&rdquo; on any item to customize the suggestion before applying.</span>
          </div>
        </div>

        {/* Proposals List */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {proposals.map((proposal, idx) => {
            const isSelected = selectedIds.has(proposal.id);
            const isEditing = editingId === proposal.id;
            const currentSuggested = editedTexts[proposal.id] ?? proposal.proposedText;
            const isModified = editedTexts[proposal.id] !== undefined && editedTexts[proposal.id] !== proposal.proposedText;

            return (
              <div
                key={proposal.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isSelected
                    ? "bg-slate-950/80 border-slate-700 shadow-md"
                    : "bg-slate-950/30 border-slate-800/60 opacity-75"
                }`}
              >
                {/* Proposal Header */}
                <div className="px-5 py-3 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(proposal.id)}
                        className="h-4 w-4 rounded border-slate-700 text-orange-500 focus:ring-orange-500 bg-slate-900"
                      />
                      <span className="font-semibold text-xs text-white">
                        Improvement #{idx + 1} &middot; <span className="text-slate-400">{proposal.section}</span>
                      </span>
                    </label>

                    {proposal.risk === "low" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Safe &middot; Low Risk
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Review Carefully
                      </span>
                    )}

                    {isModified && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Manually Edited
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <button
                        onClick={() => handleStartEdit(proposal.id, currentSuggested)}
                        className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1"
                      >
                        <Edit3 className="h-3 w-3 text-orange-400" /> Edit Wording
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleSaveEdit}
                          className="px-2.5 py-1 rounded-md text-xs font-bold text-slate-950 bg-orange-400 hover:bg-orange-300 transition flex items-center gap-1 shadow"
                        >
                          <Check className="h-3 w-3" /> Done
                        </button>
                        <button
                          onClick={() => handleResetEdit(proposal.id, proposal.proposedText)}
                          className="px-2 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 transition flex items-center gap-1"
                          title="Reset to AI suggestion"
                        >
                          <RotateCcw className="h-3 w-3" /> Reset
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Side-by-Side Comparison */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original Bullet */}
                  <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Original Resume Bullet</span>
                      <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                        Before
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans line-through decoration-rose-500/60 decoration-2">
                      {proposal.originalText}
                    </p>
                  </div>

                  {/* Suggested / Edited Replacement */}
                  <div className="p-3.5 rounded-xl bg-orange-500/5 border border-orange-500/20 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-orange-400">
                      <span>Suggested ATS Optimization</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        After
                      </span>
                    </div>

                    {isEditing ? (
                      <textarea
                        value={currentSuggested}
                        onChange={(e) =>
                          setEditedTexts((prev) => ({ ...prev, [proposal.id]: e.target.value }))
                        }
                        className="w-full h-24 p-2.5 rounded-lg bg-slate-900 border border-orange-500/50 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-sans leading-relaxed resize-none"
                      />
                    ) : (
                      <p className="text-xs text-emerald-300 leading-relaxed font-medium">
                        {currentSuggested}
                      </p>
                    )}
                  </div>
                </div>

                {/* Grounding & Evidence Footer */}
                <div className="px-5 py-3 bg-slate-950/90 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <span className="font-semibold text-orange-400">Why:</span>
                      <span>{proposal.reason}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Evidence:</span>
                    {proposal.evidence.map((ev, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 border border-slate-700 font-mono"
                      >
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <button
            onClick={onClose}
            disabled={isApplying}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              {selectedIds.size === 0 ? (
                <span className="text-rose-400">Select at least one improvement</span>
              ) : (
                `Ready to apply ${selectedIds.size} improvement${selectedIds.size > 1 ? "s" : ""}`
              )}
            </span>

            <button
              onClick={handleConfirmApply}
              disabled={selectedIds.size === 0 || isApplying}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 transition flex items-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApplying ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                  <span>Applying to Original Document...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Apply Selected Changes &amp; Re-Scan ATS</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
