import React from "react";
import { useResumeStore } from "../../store/useResumeStore";

export const TypographySettings: React.FC = () => {
  const { resume, updateTheme } = useResumeStore();

  if (!resume) return null;
  const { theme } = resume;

  const fonts = [
    { label: "Inter (Sans-serif)", value: "'Inter', sans-serif" },
    { label: "Helvetica Neue", value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
    { label: "Times New Roman (Serif)", value: "'Times New Roman', Times, serif" },
    { label: "Roboto (Sans-serif)", value: "'Roboto', sans-serif" },
    { label: "Lora (Serif)", value: "'Lora', serif" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100 mb-1">Typography</h3>
        <p className="text-xs text-zinc-500 mb-4">Adjust the fonts and text scaling of your resume.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Font Family</label>
          <select 
            value={theme.fontFamily} 
            onChange={(e) => updateTheme({ fontFamily: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-zinc-100 transition-colors outline-none"
          >
            {fonts.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-xs font-medium text-zinc-300">Base Font Size</label>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded">{theme.fontSize}px</span>
          </div>
          <input 
            type="range" 
            min="8" 
            max="18" 
            step="0.5"
            value={theme.fontSize}
            onChange={(e) => updateTheme({ fontSize: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 mt-2 font-medium">
            <span>Small</span>
            <span>Large</span>
          </div>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-xs font-medium text-zinc-300">Line Height</label>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded">{theme.lineHeight}</span>
          </div>
          <input 
            type="range" 
            min="1.0" 
            max="2.5" 
            step="0.1"
            value={theme.lineHeight}
            onChange={(e) => updateTheme({ lineHeight: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 mt-2 font-medium">
            <span>Tight</span>
            <span>Loose</span>
          </div>
        </div>
        
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-xs font-medium text-zinc-300">Letter Spacing</label>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded">{theme.letterSpacing}px</span>
          </div>
          <input 
            type="range" 
            min="-1" 
            max="3" 
            step="0.1"
            value={theme.letterSpacing}
            onChange={(e) => updateTheme({ letterSpacing: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
