import React, { useState } from "react";
import { SKILL_CATEGORIES } from "../../data/skills";
import { GlassCard } from "../ui/GlassCard";
import { Badge } from "../ui/Badge";
import { Layers, Terminal, Sparkles, CheckCircle } from "lucide-react";

export const SkillsSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const displayedCategories =
    selectedCategory === "all"
      ? SKILL_CATEGORIES
      : SKILL_CATEGORIES.filter((c) => c.categoryKey === selectedCategory);

  return (
    <section id="skills" className="relative min-h-screen w-full py-28 px-6 md:px-12 z-10">
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        
        {/* Section Heading Tag */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[#ea580c]">
            // 02 TECHNICAL ECOSYSTEM
          </span>
          <div className="h-[1px] flex-1 bg-white/10" />
        </div>

        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight">
              ENGINEERING ARSENAL<span className="text-[#ea580c]">.</span>
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl">
              Strictly grounded in real production repositories, full-stack architectures, and verified certifications.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                selectedCategory === "all"
                  ? "bg-[#ea580c] text-white font-bold"
                  : "bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              ALL SYSTEMS
            </button>
            {SKILL_CATEGORIES.map((cat) => (
              <button
                key={cat.categoryKey}
                onClick={() => setSelectedCategory(cat.categoryKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  selectedCategory === cat.categoryKey
                    ? "bg-[#ea580c] text-white font-bold"
                    : "bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                {cat.title.split(" ")[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Category Clusters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCategories.map((cat) => (
            <GlassCard key={cat.categoryKey} className="p-6 flex flex-col gap-4 border-white/10">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="font-display font-bold text-base text-white">
                  {cat.title}
                </span>
                <span className="text-[10px] font-mono text-[#ea580c] uppercase">
                  {cat.skills.length} TECHNOLOGIES
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                {cat.description}
              </p>

              <div className="space-y-2 pt-2">
                {cat.skills.map((skill) => (
                  <div
                    key={skill.name}
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-zinc-200">
                        {skill.name}
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                          skill.level === "Advanced"
                            ? "bg-[#ea580c]/15 text-[#fb923c] border border-[#ea580c]/30"
                            : skill.level === "Specialized"
                            ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                            : "bg-white/5 text-zinc-400"
                        }`}
                      >
                        {skill.level}
                      </span>
                    </div>
                    {skill.description && (
                      <span className="text-[11px] text-zinc-500 font-sans">
                        {skill.description}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>

      </div>
    </section>
  );
};
