import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Check, RefreshCw, AlertCircle, Undo2, Redo2,
  Share2, Download, Eye, FileText, ChevronDown, Printer
} from "lucide-react";

interface ResumeTopBarProps {
  resumeName: string;
  targetRole: string;
  onRename: (newName: string) => void;
  saveStatus: "saved" | "saving" | "error" | "offline";
  lastSavedTime?: string;
  onRetrySave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  paperSize: "a4" | "letter";
  onTogglePaperSize: (size: "a4" | "letter") => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onExport: (format: "pdf" | "docx" | "txt" | "json") => void;
  onShare: () => void;
  previewMode: boolean;
  onTogglePreviewMode: () => void;
}

export const ResumeTopBar: React.FC<ResumeTopBarProps> = ({
  resumeName,
  targetRole,
  onRename,
  saveStatus,
  lastSavedTime,
  onRetrySave,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  paperSize,
  onTogglePaperSize,
  zoomLevel,
  onZoomChange,
  onExport,
  onShare,
  previewMode,
  onTogglePreviewMode
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(resumeName);
  const [exportOpen, setExportOpen] = useState(false);

  const handleTitleSubmit = () => {
    if (titleInput.trim() && titleInput !== resumeName) {
      onRename(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="h-14 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 flex items-center justify-between gap-3 shrink-0 z-30">
      {/* Left Area: Navigation & Document Name */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to="/dashboard"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="h-4 w-[1px] bg-slate-800" />

        <div className="flex items-center gap-2 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSubmit();
                if (e.key === "Escape") {
                  setTitleInput(resumeName);
                  setIsEditingTitle(false);
                }
              }}
              className="bg-slate-900 border border-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-md outline-none max-w-[200px]"
            />
          ) : (
            <button
              onClick={() => {
                setTitleInput(resumeName);
                setIsEditingTitle(true);
              }}
              className="text-xs font-bold text-white hover:text-indigo-400 truncate max-w-[180px] sm:max-w-[260px] text-left transition-colors"
              title="Click to rename"
            >
              {resumeName || "Untitled Resume"}
            </button>
          )}

          {targetRole && (
            <span className="hidden sm:inline-flex text-[10px] font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
              {targetRole}
            </span>
          )}
        </div>

        {/* Real Autosave Status */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] pl-2">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-indigo-400 font-medium animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-emerald-400 font-medium" title={lastSavedTime ? `Last saved at ${lastSavedTime}` : "All changes saved"}>
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          {saveStatus === "error" && (
            <button
              onClick={onRetrySave}
              className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-medium underline cursor-pointer"
            >
              <AlertCircle className="w-3 h-3" /> Save failed (Retry)
            </button>
          )}
        </div>
      </div>

      {/* Center Controls: Undo / Redo */}
      <div className="hidden lg:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right Area: View Controls & Export Actions */}
      <div className="flex items-center gap-2">
        {/* Paper format toggle */}
        <div className="hidden xl:flex items-center text-[10px] bg-slate-900 border border-slate-800 rounded-lg p-0.5 font-bold">
          <button
            onClick={() => onTogglePaperSize("a4")}
            className={`px-2 py-0.5 rounded ${paperSize === "a4" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            A4
          </button>
          <button
            onClick={() => onTogglePaperSize("letter")}
            className={`px-2 py-0.5 rounded ${paperSize === "letter" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            Letter
          </button>
        </div>

        {/* Zoom controls */}
        <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
          <button
            onClick={() => onZoomChange(Math.max(50, zoomLevel - 15))}
            className="hover:text-white font-bold"
            title="Zoom out"
          >
            -
          </button>
          <span className="text-[11px] font-mono w-9 text-center text-slate-200">{zoomLevel}%</span>
          <button
            onClick={() => onZoomChange(Math.min(130, zoomLevel + 15))}
            className="hover:text-white font-bold"
            title="Zoom in"
          >
            +
          </button>
        </div>

        {/* Mobile/Tablet Preview toggle */}
        <button
          onClick={onTogglePreviewMode}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
            previewMode
              ? "bg-indigo-600 border-indigo-500 text-white"
              : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
          }`}
          title="Toggle Full Preview"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{previewMode ? "Editor" : "Preview"}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={onShare}
          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:text-white hover:border-slate-700 flex items-center gap-1.5 transition-all"
          title="Share public link"
        >
          <Share2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Share</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3 text-indigo-200" />
          </button>

          {exportOpen && (
            <div
              className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-2xl z-50 text-xs space-y-0.5"
              onMouseLeave={() => setExportOpen(false)}
            >
              <button
                onClick={() => {
                  setExportOpen(false);
                  onExport("pdf");
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  <span>PDF Document</span>
                </div>
                <span className="text-[9px] font-mono text-slate-500 group-hover:text-slate-400">A4/Letter</span>
              </button>
              <button
                onClick={() => {
                  setExportOpen(false);
                  onExport("docx");
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Word (.docx)</span>
                </div>
                <span className="text-[9px] font-mono text-slate-500 group-hover:text-slate-400">DOCX</span>
              </button>
              <button
                onClick={() => {
                  setExportOpen(false);
                  onExport("txt");
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Plain Text (ATS)</span>
                </div>
                <span className="text-[9px] font-mono text-slate-500 group-hover:text-slate-400">TXT</span>
              </button>
              <button
                onClick={() => {
                  setExportOpen(false);
                  onExport("json");
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Canonical JSON</span>
                </div>
                <span className="text-[9px] font-mono text-slate-500 group-hover:text-slate-400">JSON</span>
              </button>
              <div className="pt-1 mt-1 border-t border-slate-800">
                <button
                  onClick={() => {
                    setExportOpen(false);
                    window.print();
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 flex items-center gap-2"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
