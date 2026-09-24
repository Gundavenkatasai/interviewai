import React from "react";
import { Project } from "../../types";
import { X, Github, ExternalLink, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "../ui/Badge";

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-[#101014] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#16161b]">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#ea580c]">
              // {project.category}
            </span>
            <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
              {project.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            aria-label="Close Case Study"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 font-sans">
          {/* Tagline */}
          <p className="text-sm font-mono text-[#ea580c] font-medium">
            {project.tagline}
          </p>

          {/* Overview */}
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
              Architectural Overview
            </span>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {project.detailedOverview}
            </p>
          </div>

          {/* Key Metrics */}
          {project.metrics && project.metrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {project.metrics.map((m, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">{m.label}</span>
                  <span className="font-display font-bold text-base text-white mt-0.5">{m.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Highlights */}
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
              Key Engineering Highlights
            </span>
            <div className="space-y-2">
              {project.highlights.map((h, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-[#ea580c] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Technologies */}
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
              Full Technology Stack
            </span>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-zinc-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer / CTAs */}
        <div className="p-6 border-t border-white/10 bg-[#16161b] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-semibold transition-all"
            >
              <Github className="w-4 h-4" />
              <span>VIEW SOURCE CODE</span>
            </a>

            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#f97316] text-white font-mono text-xs font-bold transition-all shadow-lg shadow-[#ea580c]/25"
              >
                <span>OPEN LIVE DEPLOYMENT</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-xs font-mono text-zinc-400 hover:text-white"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
