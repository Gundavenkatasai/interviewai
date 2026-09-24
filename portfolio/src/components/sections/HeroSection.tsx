import React from "react";
import { ArrowDown, Github, Terminal, Sparkles, ExternalLink } from "lucide-react";

interface HeroSectionProps {
  onExplore: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExplore }) => {
  return (
    <section
      id="hero"
      className="relative min-h-screen w-full flex flex-col justify-between pt-28 pb-12 px-6 md:px-12 z-10"
    >
      {/* Top Metadata Strip */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between text-xs font-mono text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ea580c] animate-pulse" />
          <span className="text-zinc-400">STUDIO PORTFOLIO // 2026</span>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <span>AI • REAL-TIME • FULL-STACK</span>
          <span>•</span>
          <span className="text-emerald-400">STATUS: OPEN FOR ROLES</span>
        </div>
      </div>

      {/* Center Cinematic Hero Typography */}
      <div className="max-w-7xl mx-auto w-full my-auto py-12 flex flex-col items-start gap-4">
        {/* Monogram tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-zinc-300 backdrop-blur-md">
          <Terminal className="w-3.5 h-3.5 text-[#ea580c]" />
          <span>GUNDA VENKATA SAI</span>
          <span className="text-zinc-600">|</span>
          <span className="text-[#ea580c]">PREFERRED: SAI</span>
        </div>

        {/* Primary Headline */}
        <h1 className="font-display font-extrabold text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tighter text-white leading-none">
          SAI<span className="text-[#ea580c]">.</span>
        </h1>

        <div className="flex flex-col gap-2 max-w-2xl">
          <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-zinc-200 tracking-tight">
            FULL STACK DEVELOPER
          </h2>
          <p className="font-mono text-xs sm:text-sm text-[#ea580c] font-medium tracking-wider uppercase">
            AI • REAL-TIME • FULL-STACK
          </p>
          <p className="font-sans text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl pt-2">
            Building intelligent, real-time digital products and full-stack experiences. Focused on sub-second WebSocket architectures, autonomous AI pipelines, and high-concurrency systems.
          </p>
        </div>

        {/* Call to Actions */}
        <div className="flex flex-wrap items-center gap-4 pt-6">
          <button
            onClick={onExplore}
            data-cursor="project"
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#ea580c] hover:bg-[#f97316] text-white font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-xl shadow-[#ea580c]/25 hover:shadow-[#ea580c]/45 hover:-translate-y-0.5"
          >
            <span>VIEW PROJECTS</span>
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </button>

          <a
            href="https://github.com/Gundavenkatasai"
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="link"
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white font-mono text-xs font-medium tracking-wider uppercase transition-all"
          >
            <Github className="w-4 h-4" />
            <span>GITHUB</span>
          </a>
        </div>
      </div>

      {/* Bottom Technical Indicators Strip */}
      <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] font-mono text-zinc-500 gap-4 pt-6 border-t border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-zinc-400">ENGINEERED AT:</span>
          <span className="text-zinc-300">Lovely Professional University</span>
        </div>
        <div className="flex items-center gap-6">
          <span>SCROLL TO EXPLORE VIRTUAL WORKSTATION</span>
          <div className="w-8 h-4 rounded-full border border-white/20 flex items-center justify-center">
            <div className="w-1 h-1.5 bg-[#ea580c] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
};
