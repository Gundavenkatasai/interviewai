import React, { useState, useCallback } from "react";
import { useResumeStore } from "../../store/useResumeStore";
import {
  Download, Home, Undo2, Redo2, Check, Loader2, FileText,
  CloudOff, AlertTriangle, Bookmark, RotateCcw, ChevronDown, CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import { ApiClient } from "../../../../lib/api";

export const TopToolbar: React.FC = () => {
  const {
    resume,
    isSaving,
    lastSavedAt,
    autoSaveStatus,
    autoSaveError,
    conflictData,
    hasLocalDraft,
    history,
    future,
    undo,
    redo,
    setName,
    saveDraft,
    resolveConflict,
    restoreLocalDraft,
    discardLocalDraft
  } = useResumeStore();

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"docx" | "pdf">("docx");
  const [downloadDropdown, setDownloadDropdown] = useState(false);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleCreateSnapshot = async () => {
    setIsSavingSnapshot(true);
    const success = await saveDraft(true);
    setIsSavingSnapshot(false);
    if (success) {
      setSnapshotSuccess(true);
      setTimeout(() => setSnapshotSuccess(false), 2000);
    }
  };

  const handleDownload = useCallback(async (format: "docx" | "pdf") => {
    if (!resume) return;
    setIsDownloading(true);
    setDownloadDropdown(false);

    try {
      let blob: Blob;
      let extension = format;

      if (format === "docx") {
        blob = await ApiClient.downloadResumeDocx(resume._id);
      } else {
        // Generate validated PDF artifact
        const artifactRes = await ApiClient.generateArtifact(
          resume._id,
          resume.template || "ats_classic",
          resume.layout?.pageSize || "A4",
          "PDF"
        );

        if (artifactRes?.artifact?._id) {
          blob = await ApiClient.downloadArtifact(artifactRes.artifact._id);
        } else {
          // Fallback to original if available
          blob = await ApiClient.downloadOriginalResume(resume._id);
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (resume.filename?.replace(/\.[^.]+$/, "") || resume.name || "Resume").replace(/\s+/g, "_");
      a.download = `${safeName}.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Download failed:", err);
      alert("Download failed: " + (err.message || "Could not generate file."));
    } finally {
      setIsDownloading(false);
    }
  }, [resume]);

  return (
    <div className="relative w-full h-full px-4 flex items-center justify-between text-zinc-300">
      
      {/* Left Group */}
      <div className="flex items-center space-x-3">
        <Link 
          to="/resume/studio" 
          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
          title="Back to Resumes"
        >
          <Home className="w-5 h-5" />
        </Link>
        <div className="text-zinc-600">/</div>
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            value={resume?.name || "Untitled"} 
            onChange={handleNameChange}
            className="font-bold text-zinc-100 border-none outline-none hover:bg-zinc-800 focus:bg-zinc-800 focus:ring-1 focus:ring-zinc-700 rounded px-1.5 py-0.5 text-sm bg-transparent transition-colors w-48"
          />
          {resume && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              v{resume.version || 1} • r{resume.revision || 1}
            </span>
          )}
        </div>
      </div>

      {/* Center Group (Undo/Redo & Save Status) */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <button 
            onClick={undo}
            disabled={history.length === 0}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button 
            onClick={redo}
            disabled={future.length === 0}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Autosave Status */}
        <div className="flex items-center text-[11px] font-medium tracking-wide">
          {autoSaveStatus === "saving" && (
            <span className="flex items-center text-zinc-400">
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-indigo-400" />
              Saving...
            </span>
          )}
          {autoSaveStatus === "saved" && (
            <span className="flex items-center text-emerald-400" title={`Last saved at ${lastSavedAt}`}>
              <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              Saved {lastSavedAt ? `at ${lastSavedAt}` : ""}
            </span>
          )}
          {autoSaveStatus === "offline" && (
            <span className="flex items-center text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20" title="Offline: changes stored locally">
              <CloudOff className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Offline (Local)
            </span>
          )}
          {autoSaveStatus === "error" && (
            <button
              onClick={() => saveDraft(false)}
              className="flex items-center text-rose-400 hover:underline cursor-pointer"
              title={autoSaveError || "Click to retry saving"}
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-400" />
              Save error (Retry)
            </button>
          )}
          {autoSaveStatus === "idle" && !isSaving && (
            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
              {lastSavedAt ? `Saved ${lastSavedAt}` : "Ready"}
            </span>
          )}
        </div>

        {/* Manual Version Snapshot */}
        <button
          onClick={handleCreateSnapshot}
          disabled={isSavingSnapshot || !resume}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 rounded border border-zinc-700 transition"
          title="Save milestone version checkpoint"
        >
          {isSavingSnapshot ? (
            <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
          ) : snapshotSuccess ? (
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          ) : (
            <Bookmark className="w-3 h-3 text-zinc-400" />
          )}
          {snapshotSuccess ? "Version Saved" : "Save Version"}
        </button>
      </div>

      {/* Right Group (Export & Download) */}
      <div className="relative flex items-center space-x-2">
        <div className="relative">
          <button
            onClick={() => setDownloadDropdown(!downloadDropdown)}
            disabled={isDownloading || !resume}
            className="flex items-center px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-zinc-100 rounded hover:bg-white transition-colors disabled:opacity-50"
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 mr-1.5" />
            )}
            {isDownloading ? "Generating..." : "Export"}
            <ChevronDown className="w-3 h-3 ml-1 text-zinc-600" />
          </button>

          {downloadDropdown && (
            <div className="absolute right-0 mt-1 w-44 rounded-lg bg-zinc-900 border border-zinc-800 shadow-xl py-1 z-50 text-xs">
              <button
                onClick={() => handleDownload("docx")}
                className="w-full text-left px-3 py-2 text-zinc-200 hover:bg-zinc-800 flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Word (.docx)</span>
              </button>
              <button
                onClick={() => handleDownload("pdf")}
                className="w-full text-left px-3 py-2 text-zinc-200 hover:bg-zinc-800 flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-rose-400" />
                <span>PDF Document (.pdf)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Top Banner: Local Draft Recovery */}
      {hasLocalDraft && (
        <div className="absolute top-14 left-0 right-0 bg-amber-950/90 border-b border-amber-500/30 px-4 py-2 z-40 flex items-center justify-between text-xs text-amber-200 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Unsaved local changes detected from a previous session (browser refresh or offline).</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={restoreLocalDraft}
              className="px-2.5 py-1 bg-amber-500 text-zinc-950 font-bold rounded hover:bg-amber-400 transition"
            >
              Restore Draft
            </button>
            <button
              onClick={discardLocalDraft}
              className="px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Top Modal / Banner: Optimistic Concurrency Conflict */}
      {conflictData && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-rose-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-zinc-100">Version Conflict Detected</h3>
            </div>
            <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
              This resume was modified in another browser tab or session (Server revision: {conflictData.serverRevision ?? "?"}, your revision: {resume?.revision ?? "?"}).
              Choose how you would like to proceed to prevent data loss:
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => resolveConflict("local")}
                className="w-full py-2 px-3 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
              >
                Keep My Local Changes (Overwrite Server)
              </button>
              <button
                onClick={() => resolveConflict("server")}
                className="w-full py-2 px-3 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition"
              >
                Load Server Version (Discard Local Edits)
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};
