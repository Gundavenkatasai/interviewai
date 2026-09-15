import React from "react";
import { useResumeStore } from "../../store/useResumeStore";

export const ColorSettings: React.FC = () => {
  const { resume, updateTheme } = useResumeStore();

  if (!resume) return null;
  const { theme } = resume;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100 mb-1">Color Palette</h3>
        <p className="text-xs text-zinc-500 mb-4">Customize the colors used in your resume.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-300">Primary Color</span>
            <span className="text-[10px] text-zinc-500">Accent color for headers &amp; icons</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-500">{theme.primaryColor}</span>
            <input 
              type="color" 
              value={theme.primaryColor}
              onChange={(e) => updateTheme({ primaryColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-300">Text Color</span>
            <span className="text-[10px] text-zinc-500">Main body text color</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-500">{theme.textColor}</span>
            <input 
              type="color" 
              value={theme.textColor}
              onChange={(e) => updateTheme({ textColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-300">Heading Color</span>
            <span className="text-[10px] text-zinc-500">Section titles and names</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-500">{theme.headingColor}</span>
            <input 
              type="color" 
              value={theme.headingColor}
              onChange={(e) => updateTheme({ headingColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
