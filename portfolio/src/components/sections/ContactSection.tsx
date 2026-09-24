import React, { useState } from "react";
import { Mail, Github, Linkedin, FileText, Send, CheckCircle2, ArrowUpRight, Phone, MapPin } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setLoading(true);
    // Simulate high-speed delivery
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <section id="contact" className="relative min-h-screen w-full py-28 px-6 md:px-12 z-10">
      <div className="max-w-7xl mx-auto flex flex-col gap-16">
        
        {/* Section Heading Tag */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[#ea580c]">
            // 06 INITIATE COLLABORATION
          </span>
          <div className="h-[1px] flex-1 bg-white/10" />
        </div>

        {/* Large Quiet Editorial Heading */}
        <div className="flex flex-col gap-4 max-w-4xl">
          <h2 className="font-display font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white tracking-tight leading-none">
            LET'S BUILD<br />
            <span className="text-[#ea580c]">SOMETHING.</span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl pt-2">
            Whether you have a demanding full-stack engineering challenge, an autonomous AI pipeline to architect, or an open software engineering role, my inbox is open.
          </p>
        </div>

        {/* Main Grid: Contact Channels + Interactive Message Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Contact Coordinates & Direct Actions */}
          <div className="lg:col-span-5 flex flex-col gap-4 font-mono">
            {/* Email Card */}
            <a
              href="mailto:venkatasaigunda82@gmail.com"
              data-cursor="link"
              className="p-5 rounded-2xl bg-[#121216]/80 hover:bg-[#121216] border border-white/10 hover:border-[#ea580c]/50 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ea580c]/10 border border-[#ea580c]/30 flex items-center justify-center text-[#ea580c]">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 uppercase">DIRECT EMAIL</span>
                  <span className="text-xs font-bold text-white group-hover:text-[#ea580c] transition-colors break-all">
                    venkatasaigunda82@gmail.com
                  </span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </a>

            {/* LinkedIn Card */}
            <a
              href="https://www.linkedin.com/in/gunda-venkatasai"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="link"
              className="p-5 rounded-2xl bg-[#121216]/80 hover:bg-[#121216] border border-white/10 hover:border-[#0284c7]/50 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0284c7]/10 border border-[#0284c7]/30 flex items-center justify-center text-[#38bdf8]">
                  <Linkedin className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 uppercase">LINKEDIN NETWORK</span>
                  <span className="text-xs font-bold text-white group-hover:text-[#38bdf8] transition-colors">
                    gunda-venkatasai
                  </span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </a>

            {/* GitHub Card */}
            <a
              href="https://github.com/Gundavenkatasai"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="link"
              className="p-5 rounded-2xl bg-[#121216]/80 hover:bg-[#121216] border border-white/10 hover:border-white/30 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center text-white">
                  <Github className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 uppercase">GITHUB CODEBASES</span>
                  <span className="text-xs font-bold text-white group-hover:text-[#ea580c] transition-colors">
                    Gundavenkatasai
                  </span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </a>

            {/* Resume Download Card */}
            <a
              href="/Gunda_Venkata_Sai_Resume.docx"
              download="Gunda_Venkata_Sai_Resume.docx"
              data-cursor="link"
              className="p-5 rounded-2xl bg-gradient-to-r from-[#ea580c]/15 to-transparent border border-[#ea580c]/30 hover:border-[#ea580c]/60 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ea580c] flex items-center justify-center text-white shadow-lg shadow-[#ea580c]/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#fb923c] uppercase font-bold">OFFICIAL RESUME</span>
                  <span className="text-xs font-bold text-white">
                    Download Master Resume (.docx)
                  </span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-white" />
            </a>

            <div className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Andhra Pradesh / Punjab, India
              </span>
              <span className="text-emerald-400">Available Immediately</span>
            </div>
          </div>

          {/* Right: Functional Message Form */}
          <div className="lg:col-span-7">
            <GlassCard className="p-8 border-white/15">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 text-center font-sans">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-display font-bold text-2xl text-white">
                    Transmission Dispatched
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    Thank you for reaching out. Sai has received your message and will respond promptly at {formData.email}.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: "", email: "", message: "" });
                    }}
                    className="mt-4 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white"
                  >
                    Send Another Transmission
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5 font-sans">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-mono uppercase tracking-widest text-[#ea580c]">
                      DIRECT DISPATCH
                    </span>
                    <h3 className="font-display font-bold text-xl text-white">
                      Start a Conversation
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-zinc-400">YOUR NAME</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Alex Vance"
                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#ea580c] transition-colors font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-zinc-400">YOUR EMAIL</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="alex@company.com"
                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#ea580c] transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-zinc-400">MESSAGE & PROJECT DETAILS</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Hi Sai, we loved your work on InterviewAI and PizzaCraft. We'd like to discuss..."
                      className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#ea580c] transition-colors font-sans resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    data-cursor="link"
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#ea580c] hover:bg-[#f97316] text-white font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-xl shadow-[#ea580c]/25 disabled:opacity-50"
                  >
                    {loading ? (
                      <span>DISPATCHING...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>START A CONVERSATION</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </GlassCard>
          </div>
        </div>

      </div>
    </section>
  );
};
