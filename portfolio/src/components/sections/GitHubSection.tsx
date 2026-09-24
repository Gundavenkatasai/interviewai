import React from "react";
import { GITHUB_REPOSITORIES } from "../../data/repositories";
import { GlassCard } from "../ui/GlassCard";
import { Github, Star, GitFork, ArrowUpRight, Code2 } from "lucide-react";

export const GitHubSection: React.FC = () => {
  return (
    <section className="relative w-full py-20 px-6 md:px-12 z-10">
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        
        {/* Heading */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[#ea580c]">
            // 05 OPEN SOURCE REPOSITORIES
          </span>
          <div className="h-[1px] flex-1 bg-white/10" />
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight flex items-center gap-3">
              <Github className="w-8 h-8 text-white" />
              <span>GITHUB DIRECTORY</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Direct access to public codebases, commits, and system architecture blueprints at{" "}
              <a
                href="https://github.com/Gundavenkatasai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ea580c] hover:underline font-mono"
              >
                github.com/Gundavenkatasai
              </a>
            </p>
          </div>

          <a
            href="https://github.com/Gundavenkatasai"
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="link"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-all w-fit"
          >
            <span>VIEW ALL ON GITHUB</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Repositories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GITHUB_REPOSITORIES.map((repo) => (
            <GlassCard
              key={repo.name}
              className="p-5 flex flex-col justify-between gap-4 border-white/10 group hover:border-[#ea580c]/50 transition-all"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#ea580c]" />
                    <h3 className="font-mono font-bold text-sm text-white group-hover:text-[#ea580c] transition-colors break-all">
                      {repo.name}
                    </h3>
                  </div>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="link"
                    className="p-1 rounded text-zinc-500 hover:text-white transition-colors"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-sans line-clamp-3">
                  {repo.description}
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-3 border-t border-white/5">
                <div className="flex flex-wrap gap-1">
                  {repo.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[9px] font-mono bg-white/5 text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-1">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
                      {repo.language}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400" />
                      {repo.stars}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3 h-3 text-zinc-400" />
                      {repo.forks}
                    </span>
                  </div>
                  <span className="text-emerald-400/80 font-semibold">{repo.updated}</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

      </div>
    </section>
  );
};
