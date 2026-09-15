import React from "react";
import { useResumeStore } from "../../store/useResumeStore";
import { resumeTemplateRegistry } from "../../registry/TemplateRegistry";
import { Check } from "lucide-react";

export const TemplateSelector: React.FC = () => {
  const { resume, setTemplate } = useResumeStore();
  const templates = resumeTemplateRegistry.getAllTemplates();

  if (!resume) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100 mb-1">Resume Template</h3>
        <p className="text-xs text-zinc-500">Choose a design for your resume. This won't change your content.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {templates.map(template => (
          <div 
            key={template.id}
            onClick={() => setTemplate(template.id)}
            className={`
              relative cursor-pointer rounded-lg border-2 p-1 overflow-hidden transition-all
              ${resume.template === template.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800'}
            `}
          >
            {/* Visual thumbnail placeholder */}
            <div className={`aspect-[1/1.4] rounded flex flex-col items-center justify-center p-2 text-center text-[10px] ${resume.template === template.id ? 'bg-indigo-500/20' : 'bg-zinc-800'}`}>
              <div className={`w-full h-2 rounded mb-1 ${resume.template === template.id ? 'bg-indigo-400' : 'bg-zinc-700'}`} />
              <div className={`w-3/4 h-2 rounded mb-4 ${resume.template === template.id ? 'bg-indigo-400/70' : 'bg-zinc-700/70'}`} />
              <div className="w-full h-16 bg-zinc-900 rounded shadow-sm" />
            </div>
            
            <div className="mt-2 mb-1 px-1 flex justify-between items-center">
              <span className="text-xs font-medium text-zinc-300 truncate pr-1">{template.name}</span>
              {resume.template === template.id && (
                <Check className="w-3 h-3 text-indigo-400 flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
