import React from "react";
import { X, Check } from "lucide-react";
import { resumeTemplateRegistry, ResumeTemplateDefinition } from "../registry/TemplateRegistry";
import { ResumeTemplateId } from "../types/resume";

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: ResumeTemplateId) => void;
}

export const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  const templates = resumeTemplateRegistry.getAllTemplates();

  // Basic styled placeholders to give users a sense of the layout style
  const renderThumbnail = (template: ResumeTemplateDefinition) => {
    switch (template.id) {
      case "ats_modern":
        return (
          <div className="w-full h-full bg-white p-4 flex flex-col">
            <div className="h-6 w-3/4 border-b-2 border-indigo-600 mb-4" />
            <div className="flex-1 border-l-2 border-indigo-600 pl-2 flex flex-col gap-2">
              <div className="h-2 w-full bg-slate-200 rounded" />
              <div className="h-2 w-5/6 bg-slate-200 rounded" />
              <div className="h-2 w-4/6 bg-slate-200 rounded" />
              <div className="h-2 w-full bg-slate-200 rounded mt-2" />
              <div className="h-2 w-5/6 bg-slate-200 rounded" />
            </div>
          </div>
        );
      case "ats_minimal":
        return (
          <div className="w-full h-full bg-white p-6 flex flex-col items-center">
            <div className="h-4 w-1/2 bg-slate-800 mb-2 rounded" />
            <div className="h-1.5 w-1/4 bg-slate-400 mb-6 rounded" />
            <div className="w-full h-2 bg-slate-200 rounded mb-2" />
            <div className="w-5/6 h-2 bg-slate-200 rounded mb-2" />
            <div className="w-4/6 h-2 bg-slate-200 rounded mb-6" />
            
            <div className="w-full h-2 bg-slate-200 rounded mb-2" />
            <div className="w-5/6 h-2 bg-slate-200 rounded mb-2" />
          </div>
        );
      case "two_column":
        return (
          <div className="w-full h-full bg-white flex">
            <div className="w-1/3 h-full bg-slate-900 p-2 flex flex-col items-start gap-2">
              <div className="h-4 w-full bg-white/20 rounded" />
              <div className="h-2 w-3/4 bg-white/10 rounded mb-4" />
              <div className="h-1.5 w-full bg-white/10 rounded" />
              <div className="h-1.5 w-5/6 bg-white/10 rounded" />
            </div>
            <div className="w-2/3 h-full p-3 flex flex-col gap-3">
              <div className="h-2 w-full bg-slate-200 rounded" />
              <div className="h-2 w-5/6 bg-slate-200 rounded" />
              <div className="h-2 w-4/6 bg-slate-200 rounded" />
            </div>
          </div>
        );
      case "creative":
        return (
          <div className="w-full h-full bg-white flex flex-col">
            <div className="w-full h-12 bg-pink-600 p-2 flex flex-col justify-end">
              <div className="h-4 w-1/2 bg-white/90 rounded" />
              <div className="h-2 w-1/3 bg-white/70 rounded mt-1" />
            </div>
            <div className="flex-1 p-3 grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-2 border-r border-slate-100 pr-2">
                <div className="h-2 w-full bg-slate-200 rounded" />
                <div className="h-2 w-5/6 bg-slate-200 rounded" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-2 w-full bg-slate-200 rounded" />
                <div className="h-2 w-4/6 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        );
      case "ats_classic":
      default:
        return (
          <div className="w-full h-full bg-white p-4 flex flex-col items-center">
            <div className="h-5 w-2/3 bg-black mb-3" />
            <div className="w-full h-1 bg-black mb-3" />
            <div className="w-full flex flex-col gap-1 items-start">
              <div className="h-1.5 w-full bg-gray-300" />
              <div className="h-1.5 w-5/6 bg-gray-300" />
              <div className="h-1.5 w-4/6 bg-gray-300" />
            </div>
            <div className="w-full h-0.5 bg-gray-400 my-3" />
            <div className="w-full flex flex-col gap-1 items-start">
              <div className="h-1.5 w-full bg-gray-300" />
              <div className="h-1.5 w-5/6 bg-gray-300" />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Choose a Template</h2>
            <p className="text-slate-400 text-sm">Select a starting design for your new resume. You can change this later.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gallery */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
              <div 
                key={template.id}
                onClick={() => onSelect(template.id)}
                className="group relative flex flex-col bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden cursor-pointer hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
              >
                {/* Thumbnail container */}
                <div className="aspect-[1/1.414] bg-slate-950 p-6 relative overflow-hidden flex items-center justify-center border-b border-slate-700">
                  <div className="absolute inset-0 opacity-50 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-transparent to-slate-900/10" />
                  
                  {/* The visual representation */}
                  <div className="w-[75%] aspect-[1/1.414] shadow-lg rounded-sm overflow-hidden transform group-hover:scale-105 transition-transform duration-500">
                    {renderThumbnail(template)}
                  </div>
                  
                  {/* Overlay button */}
                  <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-full shadow-lg flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all">
                      <Check className="w-4 h-4" /> Use Template
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white text-lg">{template.name}</h3>
                    {template.atsFriendly && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ATS Optimized
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 flex-1">{template.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
