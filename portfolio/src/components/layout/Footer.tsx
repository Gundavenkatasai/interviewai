import React from "react";
import { Github, Linkedin, Mail, Heart, ArrowUp, Code2 } from "lucide-react";

interface FooterProps {
  onScrollTop: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onScrollTop }) => {
  return (
    <footer className="relative w-full border-t border-white/10 bg-[#09090b] py-16 px-6 md:px-12 z-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        
        {/* Left identity */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="font-display font-black text-xl tracking-tight text-white">
              GUNDA VENKATA SAI
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#ea580c]/10 text-[#ea580c] border border-[#ea580c]/30">
              SAI
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-mono max-w-md">
            Full-Stack Developer • AI & Speech Integrations • Real-Time WebSockets • High-Concurrency Architecture
          </p>
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-600 mt-2">
            <span>Location: Andhra Pradesh / Punjab, India</span>
            <span>•</span>
            <span className="text-emerald-500/80">Available for Software Roles</span>
          </div>
        </div>

        {/* Center / Social */}
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Gundavenkatasai"
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="link"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white hover:border-[#ea580c]/40 hover:bg-[#ea580c]/10 transition-all"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
          <a
            href="https://www.linkedin.com/in/gunda-venkatasai"
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="link"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white hover:border-[#0284c7]/40 hover:bg-[#0284c7]/10 transition-all"
          >
            <Linkedin className="w-3.5 h-3.5" />
            <span>LinkedIn</span>
          </a>
          <a
            href="mailto:venkatasaigunda82@gmail.com"
            data-cursor="link"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white hover:border-white/20 transition-all"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </a>
        </div>

        {/* Back to top button */}
        <button
          onClick={onScrollTop}
          data-cursor="link"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-400 hover:text-white hover:border-white/20 transition-all group"
          aria-label="Scroll back to top"
        >
          <span>BACK TO TOP</span>
          <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-zinc-600 gap-4">
        <span>© {new Date().getFullYear()} Gunda Venkata Sai. All verified rights reserved.</span>
        <div className="flex items-center gap-2">
          <span>Engineered with React 18 • Three.js • GSAP • Lenis</span>
        </div>
      </div>
    </footer>
  );
};
