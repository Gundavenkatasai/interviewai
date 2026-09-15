import React from "react";
import { useResumeStore } from "../../store/useResumeStore";
import { Maximize, Minimize, Settings as SettingsIcon } from "lucide-react";

export const LayoutSettings: React.FC = () => {
  const { resume, updateLayout } = useResumeStore();

  if (!resume) return null;
  const { layout } = resume;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100 mb-1">Page Layout</h3>
        <p className="text-xs text-zinc-500 mb-4">Control margins, spacing, and page format.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Page Format</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateLayout({ pageSize: 'A4' })}
              className={`py-2 px-3 flex flex-col items-center justify-center rounded-lg border transition-all ${
                layout.pageSize === 'A4' 
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400'
              }`}
            >
              <div className="w-6 h-8 border-2 rounded-sm mb-1 opacity-70" style={{ borderColor: 'currentColor' }} />
              <span className="text-xs font-semibold">A4</span>
              <span className="text-[9px] opacity-70">210 x 297 mm</span>
            </button>
            <button
              onClick={() => updateLayout({ pageSize: 'Letter' })}
              className={`py-2 px-3 flex flex-col items-center justify-center rounded-lg border transition-all ${
                layout.pageSize === 'Letter' 
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400'
              }`}
            >
              <div className="w-7 h-8 border-2 rounded-sm mb-1 opacity-70" style={{ borderColor: 'currentColor' }} />
              <span className="text-xs font-semibold">Letter</span>
              <span className="text-[9px] opacity-70">8.5 x 11 in</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Maximize className="w-4 h-4 text-zinc-500" />
              <label className="text-xs font-medium text-zinc-300">Page Margins</label>
            </div>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded">{layout.margins.top}px</span>
          </div>
          <input 
            type="range" 
            min="10" 
            max="60" 
            step="1"
            value={layout.margins.top}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              updateLayout({ margins: { top: v, right: v, bottom: v, left: v } });
            }}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Minimize className="w-4 h-4 text-zinc-500" />
              <label className="text-xs font-medium text-zinc-300">Section Spacing</label>
            </div>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded">{layout.sectionSpacing}px</span>
          </div>
          <input 
            type="range" 
            min="5" 
            max="40" 
            step="1"
            value={layout.sectionSpacing}
            onChange={(e) => updateLayout({ sectionSpacing: parseInt(e.target.value, 10) })}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
