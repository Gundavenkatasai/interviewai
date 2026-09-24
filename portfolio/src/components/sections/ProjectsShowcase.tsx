import React, { useState } from "react";
import { PROJECTS } from "../../data/projects";
import { Project } from "../../types";
import { GlassCard } from "../ui/GlassCard";
import { Badge } from "../ui/Badge";
import { ExternalLink, Github, ArrowRight, Play, Eye, Flame, MessageSquare, Terminal } from "lucide-react";
import { InterviewAIScreen } from "../three/screens/InterviewAIScreen";
import { PizzaCraftScreen } from "../three/screens/PizzaCraftScreen";
import { LPULiveScreen } from "../three/screens/LPULiveScreen";
import { QueueAnalyticsScreen } from "../three/screens/QueueAnalyticsScreen";

interface ProjectsShowcaseProps {
  onSelectProjectForModal: (project: Project) => void;
  activeScreen: "hero" | "interviewai" | "pizza_craft" | "lpulive" | "queue_analytics";
  onChangeActiveScreen: (screen: "hero" | "interviewai" | "pizza_craft" | "lpulive" | "queue_analytics") => void;
}

export const ProjectsShowcase: React.FC<ProjectsShowcaseProps> = ({
  onSelectProjectForModal,
  activeScreen,
  onChangeActiveScreen
}) => {
  const featuredProjects = PROJECTS.filter((p) => p.featured);
  const secondaryProjects = PROJECTS.filter((p) => !p.featured);

  const [activeFeaturedId, setActiveFeaturedId] = useState<string>("interviewai");

  const currentFeatured = featuredProjects.find((p) => p.id === activeFeaturedId) || featuredProjects[0];

  const handleSelectFeatured = (id: string) => {
    setActiveFeaturedId(id);
    if (id === "interviewai" || id === "pizza_craft" || id === "lpulive" || id === "queue_analytics") {
      onChangeActiveScreen(id);
    }
  };

  return (
    <section id="work" className="relative min-h-screen w-full py-28 px-6 md:px-12 z-10">
      <div className="max-w-7xl mx-auto flex flex-col gap-16">
        
        {/* Section Heading Tag */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[#ea580c]">
            // 03 FLAGSHIP ARTIFACTS
          </span>
          <div className="h-[1px] flex-1 bg-white/10" />
        </div>

        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight">
              FEATURED WORK<span className="text-[#ea580c]">.</span>
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl">
              High-concurrency systems, real-time WebSockets, and autonomous AI architectures inspected directly from source repositories.
            </p>
          </div>

          {/* Interactive Project Switcher Tabs */}
          <div className="flex flex-wrap gap-2">
            {featuredProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectFeatured(p.id)}
                data-cursor="link"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all ${
                  activeFeaturedId === p.id
                    ? "bg-[#ea580c] text-white font-bold shadow-lg shadow-[#ea580c]/30"
                    : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <span>{p.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Interactive Stage: Live Simulated Workstation Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Interactive Screen Simulation Container */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            <div className="relative w-full h-[460px] sm:h-[500px] rounded-2xl overflow-hidden bg-black/80 border border-white/15 shadow-2xl p-2 flex flex-col">
              {/* Screen Top Status bar */}
              <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-mono text-zinc-500 border-b border-white/5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  SIMULATED PRODUCTION ENVIRONMENT
                </span>
                <span>INTERACTIVE WORKSTATION</span>
              </div>

              {/* Dynamic Interactive Screen */}
              <div className="flex-1 w-full h-full pt-1">
                {activeFeaturedId === "interviewai" && <InterviewAIScreen />}
                {activeFeaturedId === "pizza_craft" && <PizzaCraftScreen />}
                {activeFeaturedId === "lpulive" && <LPULiveScreen />}
                {activeFeaturedId === "queue_analytics" && <QueueAnalyticsScreen />}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 px-2">
              <span>Interactive preview derived from actual repository architecture.</span>
              <button
                onClick={() => onSelectProjectForModal(currentFeatured)}
                className="text-[#ea580c] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Read Full Technical Architecture Spec</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Right Column: Project Architectural Intelligence Card */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <GlassCard className="p-6 flex flex-col gap-5 border-white/15">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#ea580c]">
                  {currentFeatured.category}
                </span>
                <h3 className="font-display font-bold text-2xl text-white">
                  {currentFeatured.title}
                </h3>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  {currentFeatured.tagline}
                </p>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                {currentFeatured.description}
              </p>

              {/* Key Metrics */}
              {currentFeatured.metrics && (
                <div className="grid grid-cols-2 gap-2 font-mono">
                  {currentFeatured.metrics.map((m, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex flex-col">
                      <span className="text-[9px] text-zinc-500">{m.label}</span>
                      <span className="text-sm font-bold text-white mt-0.5">{m.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tech Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentFeatured.technologies.slice(0, 6).map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-zinc-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                <a
                  href={currentFeatured.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="link"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs font-semibold transition-all"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>REPOSITORY</span>
                </a>

                {currentFeatured.liveUrl ? (
                  <a
                    href={currentFeatured.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="link"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#f97316] text-white font-mono text-xs font-bold transition-all shadow-lg shadow-[#ea580c]/20"
                  >
                    <span>LIVE DEMO</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    onClick={() => onSelectProjectForModal(currentFeatured)}
                    data-cursor="link"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-mono transition-all"
                  >
                    <span>CASE STUDY</span>
                  </button>
                )}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Secondary Real Projects Grid */}
        <div className="flex flex-col gap-6 pt-12">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
              // EXTENDED PRODUCTION ARCHITECTURES
            </span>
            <div className="h-[1px] flex-1 bg-white/5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {secondaryProjects.map((p) => (
              <GlassCard
                key={p.id}
                onClick={() => onSelectProjectForModal(p)}
                className="p-6 flex flex-col justify-between gap-4 cursor-pointer group"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#ea580c] uppercase">{p.category}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="font-display font-bold text-lg text-white group-hover:text-[#ea580c] transition-colors">
                    {p.title}
                  </h4>
                  <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-3 border-t border-white/5">
                  <div className="flex flex-wrap gap-1">
                    {p.technologies.slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-zinc-400"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                    <span>Inspect Case Study</span>
                    <span className="text-zinc-400 group-hover:text-white transition-colors">
                      Details →
                    </span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
