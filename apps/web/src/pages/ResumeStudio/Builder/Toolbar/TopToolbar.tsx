import React, { useState, useCallback } from "react";
import { useResumeStore } from "../../store/useResumeStore";
import { Download, Home, Undo2, Redo2, Check, Loader2, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { ApiClient } from "../../../../lib/api";

export const TopToolbar: React.FC = () => {
  const { resume, isSaving, lastSavedAt, history, future, undo, redo } = useResumeStore();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    useResumeStore.setState(state => {
      if (!state.resume) return state;
      const newResume = { ...state.resume, name: e.target.value };
      return { resume: newResume, isDirty: true };
    });
  };

  const handleDownload = useCallback(async () => {
    if (!resume) return;
    setIsDownloading(true);

    try {
      let blob;
      let extension = "docx";
      if (resume.fileType === "pdf" && resume.hasRawText) {
        // Download the original PDF (since edits aren't injected back yet)
        blob = await ApiClient.downloadOriginalResume(resume._id);
        extension = "pdf";
      } else {
        // For imported DOCX files or standard templates: generate DOCX
        blob = await ApiClient.downloadResumeDocx(resume._id);
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (resume.filename?.replace(/\.[^.]+$/, "") || resume.name || "Resume").replace(/\s+/g, "_");
      a.download = `${safeName}_edited.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  }, [resume]);

  return (
    <div className="w-full h-full px-4 flex items-center justify-between text-zinc-300">
      
      {/* Left Group */}
      <div className="flex items-center space-x-3">
        <Link 
          to="/resume/studio" 
          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
        >
          <Home className="w-5 h-5" />
        </Link>
        <div className="text-zinc-600">/</div>
        <div className="flex flex-col justify-center">
          <input 
            type="text" 
            value={resume?.name || "Untitled"} 
            onChange={handleNameChange}
            className="font-bold text-zinc-100 border-none outline-none hover:bg-zinc-800 focus:bg-zinc-800 focus:ring-1 focus:ring-zinc-700 rounded px-1.5 py-0.5 -ml-1.5 text-sm bg-transparent transition-colors w-48"
          />
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
        <div className="flex items-center text-[10px] uppercase font-bold tracking-wider text-zinc-500">
          {isSaving ? (
            <>
              <Loader2 className="w-3 h-3 mr-1.5 animate-spin text-zinc-400" />
              Saving
            </>
          ) : (
            <>
              <Check className="w-3 h-3 mr-1.5 text-zinc-400" />
              Saved
            </>
          )}
        </div>
      </div>

      {/* Right Group (Export) */}
      <div className="flex items-center space-x-3">
        <button
          onClick={handleDownload}
          disabled={isDownloading || !resume}
          className="flex items-center px-3 py-1.5 text-sm font-semibold text-zinc-950 bg-zinc-100 rounded hover:bg-white transition-colors disabled:opacity-50"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-1.5" />
          )}
          {isDownloading ? "Preparing..." : "Download"}
        </button>
      </div>
      
    </div>
  );
};
