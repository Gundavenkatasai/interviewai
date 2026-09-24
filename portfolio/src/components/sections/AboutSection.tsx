import React from "react";
import { Award, Cpu, ShieldCheck, Zap, BookOpen, MapPin, CheckCircle2 } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";

export const AboutSection: React.FC = () => {
  const stats = [
    { label: "DSA Problems Solved", value: "250+", detail: "LeetCode & GeeksforGeeks" },
    { label: "Cloud Arcade Labs", value: "240+", detail: "GCP IAM & Infrastructure" },
    { label: "Catalog Architected", value: "105+", detail: "PizzaCraft Menu Persistence" },
    { label: "Real-Time Latency", value: "<450ms", detail: "Groq Whisper & Socket.IO" }
  ];

  return (
    <section id="about" className="relative min-h-screen w-full py-28 px-6 md:px-12 z-10">
      <div className="max-w-7xl mx-auto flex flex-col gap-16">
        
        {/* Section Heading Tag */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[#ea580c]">
            // 01 ARCHITECT PROFILE
          </span>
          <div className="h-[1px] flex-1 bg-white/10" />
        </div>

        {/* Editorial Name & Title */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Large Kinetic Editorial Typography */}
          <div className="lg:col-span-7 flex flex-col">
            <h2 className="font-display font-black text-6xl sm:text-7xl md:text-8xl tracking-tighter text-white leading-none">
              GUNDA<br />
              VENKATA<br />
              <span className="text-[#ea580c]">SAI.</span>
            </h2>

            <div className="pt-8 flex flex-col gap-4">
              <p className="font-mono text-sm sm:text-base text-zinc-300 font-semibold tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
                Computer Science & Engineering • Lovely Professional University
              </p>

              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl">
                I am a full-stack engineer driven by the intersection of high-concurrency systems, real-time data streaming, and autonomous AI pipelines. I construct production software from scratch—ranging from enterprise multi-portal commerce platforms to sub-second audio transcription engines and computer vision crowd monitors.
              </p>

              {/* Specialization Pills */}
              <div className="pt-4 flex flex-wrap gap-2">
                {["Artificial Intelligence", "Real-Time WebSockets", "High-Concurrency APIs", "Distributed Microservices", "Computer Vision"].map((pill) => (
                  <span
                    key={pill}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300 hover:border-[#ea580c]/40 hover:text-white transition-all"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Portrait & Core Credential Card */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <GlassCard className="p-6 overflow-hidden flex flex-col gap-5 border-white/15">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#ea580c]/40 shadow-xl shadow-[#ea580c]/15 shrink-0">
                  <img
                    src="/sai.jpeg"
                    alt="Gunda Venkata Sai"
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      // Fallback to GitHub avatar
                      (e.target as HTMLImageElement).src = "https://avatars.githubusercontent.com/u/148543922?v=4";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                <div className="flex flex-col">
                  <span className="font-display font-bold text-lg text-white">Gunda Venkata Sai</span>
                  <span className="text-xs font-mono text-[#ea580c]">Full Stack Developer</span>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 pt-1">
                    <MapPin className="w-3 h-3 text-zinc-500" />
                    <span>Andhra Pradesh / Punjab, India</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs font-mono">
                <div className="flex items-start gap-2 text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>B.Tech in CSE at Lovely Professional University (CGPA: 7.69)</span>
                </div>
                <div className="flex items-start gap-2 text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Oracle Cloud Certified Generative AI Professional</span>
                </div>
                <div className="flex items-start gap-2 text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>NPTEL Certified in Advanced Computer Networks</span>
                </div>
                <div className="flex items-start gap-2 text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Finalist at HackSmart Hackathon (Battery Smart x AWS)</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Dynamic Metric Highlights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, idx) => (
            <GlassCard key={idx} className="p-6 flex flex-col gap-1 border-white/5">
              <span className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
                {s.value}
              </span>
              <span className="text-xs font-mono font-semibold text-[#ea580c] uppercase tracking-wider">
                {s.label}
              </span>
              <span className="text-[11px] font-mono text-zinc-500 pt-1">
                {s.detail}
              </span>
            </GlassCard>
          ))}
        </div>

      </div>
    </section>
  );
};
