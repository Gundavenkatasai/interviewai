import React, { useState } from "react";
import { useResumeStore } from "../../store/useResumeStore";
import { resumeTemplateRegistry } from "../../registry/TemplateRegistry";
import { ZoomIn, ZoomOut, Maximize, FileText, Lock, Info, Download } from "lucide-react";
import { ApiClient } from "../../../../lib/api";

// -------------- Normal Live Preview --------------------
export const LivePreview: React.FC = () => {
  const { resume } = useResumeStore();
  const [zoom, setZoom] = useState(0.75);

  // Look up the renderer directly — no useMemo so the preview re-renders
  // whenever ANY field in the resume store changes (not just the template).
  const TemplateRenderer = (() => {
    if (!resume) return null;
    const def = resumeTemplateRegistry.getTemplate(resume.template);
    return def ? def.renderer : null;
  })();

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 1.5));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.3));
  const handleResetZoom = () => setZoom(0.75);

  if (!resume) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div
          className="bg-white shadow-2xl animate-pulse flex items-center justify-center"
          style={{ width: "794px", height: "1123px", transform: `scale(${zoom})`, transformOrigin: "center top" }}
        >
          <span className="text-gray-300 text-lg">Loading Resume...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center w-full h-full">
      {/* Scrollable canvas area */}
      <div className="flex-1 overflow-auto w-full flex justify-center py-8 px-4">
        <div
          style={{
            width: `${794 * zoom}px`,
            height: `${1123 * zoom}px`,
            flexShrink: 0,
          }}
        >
          <div
            className="bg-white shadow-[0_8px_60px_rgba(0,0,0,0.5)] origin-top-left overflow-hidden"
            style={{
              width: "794px",
              minHeight: "1123px",
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
          >
            {TemplateRenderer ? (
              <TemplateRenderer resume={resume} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-gray-400">
                <p className="text-lg mb-2">Template not found</p>
                <p className="text-sm text-gray-500">Please select a valid template from the Design panel on the right.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 shadow-lg">
        <button
          onClick={handleZoomOut}
          className="p-1 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-30"
          disabled={zoom <= 0.3}
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="text-xs font-mono font-bold text-zinc-300 hover:text-zinc-100 w-12 text-center"
          title="Reset Zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={handleZoomIn}
          className="p-1 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-30"
          disabled={zoom >= 1.5}
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-zinc-700 mx-1" />
        <button
          onClick={handleResetZoom}
          className="p-1 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          title="Fit to screen"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
