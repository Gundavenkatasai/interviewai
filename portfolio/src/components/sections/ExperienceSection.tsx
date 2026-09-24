import React, { useState } from "react";
import { TIMELINE_ITEMS } from "../../data/timeline";
import { GlassCard } from "../ui/GlassCard";
import { GraduationCap, Award, Trophy, Code2, CheckCircle2, Calendar, MapPin } from "lucide-react";

export const ExperienceSection: React.FC = () => {
  const [filter, setFilter] = useState<"all" | "education" | "certification" | "achievement">("all");

  const filteredItems =
    filter === "all"
      ? TIMELINE_ITEMS
      : TIMELINE_ITEMS.filter((item) => {
          if (filter === "achievement") return item.category === "achievement" || item.category === "hackathon";
          return item.category === filter;
        });

  return (
    <section id="experience" className="relative min-h-screen w-full py-28 px-6 md:px-12 z-10">
      <div className="max-w-7xl mx-auto flex flex-col gap-16">
        
        {/* Section Heading Tag */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[#ea580c]">
            // 04 VERIFIED TIMELINE & CREDENTIALS
          </span>
          <div className="h-[1px] flex-1 bg-white/10" />
        </div>

        {/* Section Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight">
              EDUCATION & MERIT<span className="text-[#ea580c]">.</span>
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl">
              100% verified academic credentials, industry certifications, and algorithmic problem-solving milestones.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { label: "ALL MILESTONES", value: "all" },
                { label: "EDUCATION", value: "education" },
                { label: "CERTIFICATIONS", value: "certification" },
                { label: "ACHIEVEMENTS", value: "achievement" }
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  filter === tab.value
                    ? "bg-[#ea580c] text-white font-bold"
                    : "bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Stream */}
        <div className="relative border-l border-white/10 ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-12">
          {filteredItems.map((item) => (
            <div key={item.id} className="relative group">
              {/* Timeline Indicator Dot */}
              <div className="absolute -left-[31px] sm:-left-[47px] top-1.5 w-4 h-4 rounded-full bg-[#121216] border-2 border-[#ea580c] group-hover:scale-125 transition-transform" />

              <GlassCard className="p-6 flex flex-col gap-4 border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-mono text-[#ea580c] uppercase font-bold tracking-wider">
                      {item.organization}
                    </span>
                    <h3 className="font-display font-bold text-xl text-white">
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                    {item.grade && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {item.grade}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      {item.period}
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                  {item.description}
                </p>

                {item.highlights && item.highlights.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {item.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#ea580c] shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                )}

                {item.location && (
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 pt-2 border-t border-white/5">
                    <MapPin className="w-3 h-3" />
                    <span>{item.location}</span>
                  </div>
                )}
              </GlassCard>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
