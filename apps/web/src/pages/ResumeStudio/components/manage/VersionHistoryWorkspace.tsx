import React, { useState, useEffect } from "react";
import {
  GitBranch, Clock, RotateCcw, Eye, Plus, AlertTriangle,
  CheckCircle2, RefreshCw, ArrowRight
} from "lucide-react";
import { ApiClient } from "../../../../lib/api";

interface VersionHistoryWorkspaceProps {
  resume: any;
  onRestoreVersion: (restoredResume: any) => void;
  onOpenCompare: (versionAId: string, versionBId: string) => void;
}

export const VersionHistoryWorkspace: React.FC<VersionHistoryWorkspaceProps> = ({
  resume,
  onRestoreVersion,
  onOpenCompare,
}) => {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  const fetchVersions = async () => {
    if (!resume?._id) return;
    setLoading(true);
    setError(null);
    try {
      const vList = await ApiClient.getResumeVersions(resume._id);
      setVersions(vList);
    } catch (err: any) {
      setError(err.message || "Failed to load version history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [resume?._id]);

  const handleRestore = async (versionId: string) => {
    if (!window.confirm("Are you sure you want to restore this version? Your current state will be saved as a new version.")) {
      return;
    }
    setRestoringId(versionId);
    setError(null);
    try {
      const res = await ApiClient.restoreResumeVersion(resume._id, versionId);
      if (res?.resume) {
        onRestoreVersion(res.resume);
      }
      fetchVersions();
    } catch (err: any) {
      setError(err.message || "Failed to restore version.");
    } finally {
      setRestoringId(null);
    }
  };

  const toggleSelectForCompare = (versionId: string) => {
    if (selectedForCompare.includes(versionId)) {
      setSelectedForCompare(selectedForCompare.filter((id) => id !== versionId));
    } else {
      if (selectedForCompare.length >= 2) {
        setSelectedForCompare([selectedForCompare[1], versionId]);
      } else {
        setSelectedForCompare([...selectedForCompare, versionId]);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-semibold text-slate-100">Version Snapshots & History</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Every major edit and tailoring operation creates an immutable snapshot in MongoDB. Restore or compare any version anytime.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedForCompare.length === 2 && (
              <button
                onClick={() => onOpenCompare(selectedForCompare[0], selectedForCompare[1])}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                Compare Selected (2)
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={fetchVersions}
              disabled={loading}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors cursor-pointer"
              title="Refresh version list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-sm text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Version List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
            Loading version snapshots...
          </div>
        ) : versions.length > 0 ? (
          versions.map((ver: any, idx: number) => {
            const isSelected = selectedForCompare.includes(ver._id || ver.id);
            const isCurrent = idx === 0;

            return (
              <div
                key={ver._id || ver.id || idx}
                className={`p-5 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-indigo-950/20 border-indigo-500"
                    : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 font-mono text-xs font-bold">
                      v{ver.versionNumber || versions.length - idx}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-200">
                          {ver.name || `Snapshot v${ver.versionNumber || versions.length - idx}`}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold rounded uppercase">
                            Current Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(ver.createdAt || Date.now()).toLocaleString()}
                        </span>
                        {ver.changeSummary && <span>• {ver.changeSummary}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => toggleSelectForCompare(ver._id || ver.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-500"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {isSelected ? "Selected for Diff" : "Select to Compare"}
                    </button>

                    {!isCurrent && (
                      <button
                        onClick={() => handleRestore(ver._id || ver.id)}
                        disabled={restoringId === (ver._id || ver.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${restoringId === (ver._id || ver.id) ? "animate-spin" : ""}`} />
                        Restore
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-12 text-center">
            <GitBranch className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-medium text-slate-300">No Past Versions Stored</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              As you edit your resume or run tailoring workflows, persistent version history snapshots will be saved here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
