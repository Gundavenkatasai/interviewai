import React, { useState, useEffect } from "react";
import {
  GitCompare, ArrowLeft, RefreshCw, AlertTriangle,
  Plus, Minus, Edit3, CheckCircle2
} from "lucide-react";
import { ApiClient } from "../../../../lib/api";

interface ResumeCompareWorkspaceProps {
  resume: any;
  initialVersionA?: string;
  initialVersionB?: string;
  onBack: () => void;
}

export const ResumeCompareWorkspace: React.FC<ResumeCompareWorkspaceProps> = ({
  resume,
  initialVersionA,
  initialVersionB,
  onBack,
}) => {
  const [versions, setVersions] = useState<any[]>([]);
  const [versionA, setVersionA] = useState<string>(initialVersionA || "");
  const [versionB, setVersionB] = useState<string>(initialVersionB || "");
  const [comparing, setComparing] = useState(false);
  const [diffResult, setDiffResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersions = async () => {
      if (!resume?._id) return;
      try {
        const vList = await ApiClient.getResumeVersions(resume._id);
        setVersions(vList);
        if (!versionA && vList.length >= 1) setVersionA(vList[0]._id || vList[0].id);
        if (!versionB && vList.length >= 2) setVersionB(vList[1]._id || vList[1].id);
      } catch (err) {}
    };
    fetchVersions();
  }, [resume?._id]);

  const handleRunCompare = async () => {
    if (!resume?._id || !versionA || !versionB) {
      setError("Please select two versions to compare.");
      return;
    }
    if (versionA === versionB) {
      setError("Please select two different versions to compute a diff.");
      return;
    }

    setComparing(true);
    setError(null);
    try {
      const res = await ApiClient.compareResumeVersions(resume._id, versionA, versionB);
      setDiffResult(res?.comparison || res?.diff || res);
    } catch (err: any) {
      setError(err.message || "Failed to compare versions.");
    } finally {
      setComparing(false);
    }
  };

  useEffect(() => {
    if (versionA && versionB && versionA !== versionB) {
      handleRunCompare();
    }
  }, [versionA, versionB]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
              title="Back to Versions"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-semibold text-slate-100">Side-by-Side Version Diff</h2>
            </div>
          </div>

          <button
            onClick={handleRunCompare}
            disabled={comparing}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${comparing ? "animate-spin" : ""}`} />
            {comparing ? "Comparing..." : "Recompute Diff"}
          </button>
        </div>

        {/* Version Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/60">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Base Version (Left)
            </label>
            <select
              value={versionA}
              onChange={(e) => setVersionA(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {versions.map((v, i) => (
                <option key={v._id || v.id} value={v._id || v.id}>
                  v{v.versionNumber || versions.length - i}: {v.name || "Snapshot"} ({new Date(v.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Comparison Version (Right)
            </label>
            <select
              value={versionB}
              onChange={(e) => setVersionB(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {versions.map((v, i) => (
                <option key={v._id || v.id} value={v._id || v.id}>
                  v{v.versionNumber || versions.length - i}: {v.name || "Snapshot"} ({new Date(v.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-sm text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Diff Results */}
      {diffResult ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Added: {diffResult.addedCount ?? diffResult.added?.length ?? 0}
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Removed: {diffResult.removedCount ?? diffResult.removed?.length ?? 0}
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Modified: {diffResult.modifiedCount ?? diffResult.modified?.length ?? 0}
            </span>
          </div>

          {/* Diff Items */}
          <div className="space-y-3">
            {diffResult.diffs?.map((item: any, idx: number) => {
              const isAdd = item.type === "added";
              const isRem = item.type === "removed";
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border text-xs font-sans space-y-1.5 ${
                    isAdd
                      ? "bg-emerald-950/10 border-emerald-500/30 text-emerald-300"
                      : isRem
                      ? "bg-rose-950/10 border-rose-500/30 text-rose-300"
                      : "bg-blue-950/10 border-blue-500/30 text-blue-200"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold uppercase tracking-wider text-[11px]">
                    <span className="flex items-center gap-1.5">
                      {isAdd ? <Plus className="w-3.5 h-3.5" /> : isRem ? <Minus className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                      {item.section || "Content"} ({item.type})
                    </span>
                    <span className="font-mono text-[10px] opacity-70">{item.path}</span>
                  </div>

                  {item.before && (
                    <div className="p-2 bg-slate-950/60 rounded border border-rose-500/20 text-rose-300 line-through">
                      {item.before}
                    </div>
                  )}
                  {item.after && (
                    <div className="p-2 bg-slate-950/60 rounded border border-emerald-500/20 text-emerald-300">
                      {item.after}
                    </div>
                  )}
                  {item.text && !item.before && !item.after && (
                    <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
                      {item.text}
                    </div>
                  )}
                </div>
              );
            })}

            {(!diffResult.diffs || diffResult.diffs.length === 0) && (
              <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-xl text-center text-sm text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                No content differences detected between these two version snapshots.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-12 text-center text-slate-500 text-sm">
          Select two distinct versions above to compute the side-by-side diff.
        </div>
      )}
    </div>
  );
};
