import { Link } from "react-router-dom";
import {
  Compass, Briefcase, FileText, ScanLine, PlayCircle, Kanban,
  Sparkles, BarChart2, ArrowRight, ShieldCheck, CheckCircle2,
  Terminal, Award, Layers
} from "lucide-react";
import { MechanicalButton } from "../components/ui/MechanicalButton";
import { InkBleedButton } from "../components/ui/InkBleedButton";

const instruments = [
  {
    code: "01. RADAR",
    title: "Flight Board & Ticket Feed",
    desc: "Perforated index slips aggregated across engineering pipelines with real-time analog match gauges.",
    href: "/jobs",
    badge: "BOARDING PASSES"
  },
  {
    code: "02. BLUEPRINT",
    title: "Architect's Drafting Desk",
    desc: "Metric A4 canvas with drafting ruler margins and pull-out yellow sticky annotation upgrades.",
    href: "/resume/studio",
    badge: "ZERO HALLUCINATION"
  },
  {
    code: "03. BENCH",
    title: "Optical ATS Scanning Bench",
    desc: "Side-by-side illuminated light-table with laser scan bar and raw OCR parse redline corrections.",
    href: "/resume/ats-checker",
    badge: "OCR COMPLIANCE"
  },
  {
    code: "04. ON-AIR",
    title: "Broadcast Mock Interview Studio",
    desc: "Analog LED audio-meter, candidate broadcast camera bezel, and teleprompter countdown ring.",
    href: "/interview/session/demo",
    badge: "60FPS BROADCAST"
  },
  {
    code: "05. RACK",
    title: "Application Card Catalog Rack",
    desc: "Tactile manila folder tabbed Kanban lanes with corner readiness notches and velocity tracking.",
    href: "/pipeline",
    badge: "MANILA INDEX"
  },
  {
    code: "06. ROLODEX",
    title: "Journalist's STAR Story Bank",
    desc: "4-column interconnected sequence cards (S-T-A-R) with 1-click precision metric injection.",
    href: "/stories",
    badge: "COMPETENCY MATRIX"
  },
];

export default function LandingPage() {
  return (
    <div className="bg-[#F5F3EE] text-[#181614] font-sans min-h-screen flex flex-col">
      {/* Top Heritage Notice */}
      <div className="bg-white border-b border-[#E5E0D4] px-4 py-2 text-center text-xs font-mono text-[#5C564E] flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#C84B26]" />
        <span>WARM INDUSTRIAL EDITORIAL WORKSPACE • PRECISION CAREER INSTRUMENTATION</span>
      </div>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-[#FAF8F5] border border-[#DCD5C6] text-xs font-mono text-[#181614]">
          <span className="font-bold text-[#C84B26]">[SYSTEM.EDITION.v2.4]</span>
          <span>AUTONOMOUS ENGINEERING CAREER SUITE</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#181614] leading-[1.08] max-w-4xl mx-auto">
          The Tactile, Engineered Workspace for Technical Careers.
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#5C564E] font-serif leading-relaxed">
          Reject generic AI glows and cold grey dashboards. Interview AI provides precision physical instruments—from architectural drafting desks to optical ATS scanning benches.
        </p>

        {/* Tactile Action Triggers */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
          <Link to="/jobs">
            <MechanicalButton variant="vermilion" size="lg" icon={<Briefcase className="w-4 h-4" />}>
              Open Flight Board
            </MechanicalButton>
          </Link>
          <Link to="/resume/studio">
            <MechanicalButton variant="navy" size="lg" icon={<FileText className="w-4 h-4" />}>
              Architect Drafting Desk
            </MechanicalButton>
          </Link>
          <Link to="/interview/session/demo">
            <InkBleedButton className="px-5 py-2.5 text-base">
              Try Broadcast Studio
            </InkBleedButton>
          </Link>
        </div>
      </section>

      {/* The 6 Physical Instruments Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 w-full flex-1">
        <div className="border-b border-[#E5E0D4] pb-3 mb-8 flex items-baseline justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C8479]">
              WORKSPACE APPARATUS
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#181614] tracking-tight">
              Physical & Editorial Instrument Catalog
            </h2>
          </div>
          <span className="text-xs font-mono text-[#8C8479]">6 APPARATUS DEPLOYED</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instruments.map(inst => (
            <Link
              key={inst.code}
              to={inst.href}
              className="bg-white border border-[#E5E0D4] rounded-lg p-6 shadow-[0_1px_3px_rgba(24,22,20,0.04)] hover:shadow-md hover:border-[#D5CEBF] transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-[#172535] bg-[#EFECE6] px-2 py-0.5 rounded border border-[#DCD5C6]">
                    {inst.code}
                  </span>
                  <span className="text-[9px] font-mono text-[#2E6347] bg-[#EBF3EE] px-1.5 py-0.5 rounded border border-[#D0E3D6]">
                    {inst.badge}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-lg text-[#181614] tracking-tight group-hover:text-[#C84B26] transition-colors mt-2">
                  {inst.title}
                </h3>

                <p className="text-xs text-[#5C564E] leading-relaxed mt-2">
                  {inst.desc}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-[#E5E0D4] flex items-center justify-between text-xs font-mono text-[#C84B26]">
                <span className="font-semibold group-hover:underline">Operate Instrument</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Editorial Footer */}
      <footer className="border-t border-[#E5E0D4] bg-white py-8 px-6 text-center text-xs font-mono text-[#8C8479]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-[#C84B26]" />
            <span className="font-serif font-bold text-sm text-[#181614]">INTERVIEW AI</span>
            <span>• WARM INDUSTRIAL EDITORIAL SPECIFICATION</span>
          </div>
          <div>ESTABLISHED 2026 • DETERMINISTIC CAREER INSTRUMENTATION</div>
        </div>
      </footer>
    </div>
  );
}
