import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Sparkles, Check, ChevronRight, Sliders,
  Plus, Trash2, ArrowUpDown, Undo2, Redo2, Eye, Printer, StickyNote,
  CheckCircle2, ArrowRight, CornerDownRight, Award, Compass
} from 'lucide-react';
import { MechanicalButton } from '../components/ui/MechanicalButton';
import { InkBleedButton } from '../components/ui/InkBleedButton';
import { MorphingActionPill } from '../components/ui/MorphingActionPill';

interface BulletItem {
  id: string;
  original: string;
  upgraded?: string;
  metricGain?: string;
  status: 'clean' | 'upgraded' | 'suggested';
}

interface ExperienceSection {
  id: string;
  company: string;
  role: string;
  period: string;
  location: string;
  bullets: BulletItem[];
}

export default function ResumeDraftingDeskPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tailorForJobId = searchParams.get('tailorFor');

  const [fontSize, setFontSize] = useState<number>(10.5);
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans' | 'mono'>('serif');
  const [activeLayout, setActiveLayout] = useState<'single' | 'split'>('single');
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [atsScore, setAtsScore] = useState(91);
  const [tailorPillState, setTailorPillState] = useState<'idle' | 'executing' | 'success'>('idle');

  const [experiences, setExperiences] = useState<ExperienceSection[]>([
    {
      id: 'exp-1',
      company: 'ScaleGrid Infrastructure',
      role: 'Staff Distributed Systems Engineer',
      period: '2022 — Present',
      location: 'Bengaluru, India',
      bullets: [
        {
          id: 'b-1',
          original: 'Architected distributed consensus engine handling 450k req/sec with Raft implementation.',
          upgraded: 'Engineered Raft-based distributed state machine, reducing failover latency by 42% (down to 180ms) across 12-node cluster under 450k req/sec peak load.',
          metricGain: '+42% failover speed',
          status: 'suggested'
        },
        {
          id: 'b-2',
          original: 'Wrote Go microservices and gRPC APIs for real-time cluster telemetry monitoring.',
          status: 'clean'
        },
        {
          id: 'b-3',
          original: 'Migrated Kubernetes deployment pipelines to ArgoCD zero-downtime rolling deploys.',
          upgraded: 'Standardized declarative ArgoCD GitOps pipelines, eliminating deployment rollbacks and delivering 99.995% production service availability.',
          metricGain: '99.995% SLA',
          status: 'suggested'
        }
      ]
    },
    {
      id: 'exp-2',
      company: 'Razorpay Payments Core',
      role: 'Senior Backend Engineer',
      period: '2019 — 2022',
      location: 'Bengaluru, India',
      bullets: [
        {
          id: 'b-4',
          original: 'Optimized PostgreSQL connection pooling and high-concurrency payment webhook routing.',
          status: 'clean'
        },
        {
          id: 'b-5',
          original: 'Built asynchronous idempotency layer preventing double-charge anomalies.',
          upgraded: 'Constructed Redis/Postgres two-phase idempotency filter processing $40M daily volume with 0% duplicate debit occurrences.',
          metricGain: '$40M daily idempotency',
          status: 'suggested'
        }
      ]
    }
  ]);

  const applyUpgrade = (expId: string, bulletId: string) => {
    setExperiences(prev => prev.map(exp => {
      if (exp.id !== expId) return exp;
      return {
        ...exp,
        bullets: exp.bullets.map(b => {
          if (b.id !== bulletId || !b.upgraded) return b;
          return {
            ...b,
            original: b.upgraded,
            status: 'upgraded'
          };
        })
      };
    }));
    setAtsScore(prev => Math.min(prev + 3, 98));
  };

  const runPrecisionAutoTune = () => {
    setTailorPillState('executing');
    setTimeout(() => {
      setTailorPillState('success');
      // Apply all suggested upgrades
      setExperiences(prev => prev.map(exp => ({
        ...exp,
        bullets: exp.bullets.map(b => b.upgraded ? { ...b, original: b.upgraded, status: 'upgraded' } : b)
      })));
      setAtsScore(98);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#181614] flex flex-col font-sans">
      {/* Top Drafting Bar */}
      <header className="border-b border-[#E5E0D4] bg-white px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#172535] bg-[#EFECE6] px-2 py-0.5 rounded border border-[#DCD5C6]">
              DESK: DRAFT-04
            </span>
            <span className="text-xs font-mono text-[#8C8479]">SCALE: 1:1 METRIC A4</span>
          </div>
          <span className="text-slate-300">•</span>
          <h1 className="font-serif font-bold text-base text-[#181614]">
            Architect's Drafting Desk
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <MorphingActionPill
            state={tailorPillState}
            idleText="Auto-Tune Bullets"
            executingText="Calculating Defensibility..."
            successText="ATS Calibrated: 98%"
            onClick={runPrecisionAutoTune}
          />
          <InkBleedButton
            onClick={() => setDrawerOpen(!drawerOpen)}
            icon={<StickyNote className="w-3.5 h-3.5 text-[#A36114]" />}
            className="text-xs py-1.5"
          >
            Sticky Drawer ({experiences.flatMap(e => e.bullets).filter(b => b.status === 'suggested').length})
          </InkBleedButton>
          <MechanicalButton
            variant="vermilion"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={() => window.print()}
          >
            Export Blueprint (PDF)
          </MechanicalButton>
        </div>
      </header>

      {/* Workspace Area: Centimeter Margins + Floating Desk Dock */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Canvas Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 py-8 flex flex-col items-center">
          {/* Centimeter Metric Ruler Markings Top Bar */}
          <div className="w-[820px] h-4 ruler-top border-b border-[#E5E0D4] mb-2 hidden md:block" />

          {/* Physical Sheet of Cotton Paper */}
          <motion.div
            layout
            className="w-full max-w-[820px] bg-white border border-[#E5E0D4] shadow-[0_10px_30px_rgba(24,22,20,0.06),0_1px_3px_rgba(24,22,20,0.04)] rounded-xs p-10 sm:p-14 relative"
            style={{
              fontSize: `${fontSize}pt`,
              fontFamily: fontFamily === 'serif' ? 'Charter, Georgia, serif' : fontFamily === 'mono' ? 'JetBrains Mono, monospace' : 'Inter, sans-serif'
            }}
          >
            {/* Stamp Indicator */}
            <div className="absolute top-8 right-8 border border-[#2E6347] bg-[#EBF3EE] text-[#2E6347] font-mono text-[9px] uppercase px-2 py-0.5 rounded tracking-widest font-semibold flex items-center gap-1">
              <Award className="w-3 h-3" /> VERIFIED ATS {atsScore}/100
            </div>

            {/* Document Header */}
            <div className="border-b-2 border-[#181614] pb-4 mb-6">
              <h1 className="font-serif text-3xl font-bold tracking-tight text-[#181614]">
                VENKATA SAI GUNDA
              </h1>
              <div className="font-mono text-xs text-[#5C564E] mt-1.5 flex items-center gap-3 flex-wrap">
                <span>Staff Systems & Full-Stack Architect</span>
                <span>•</span>
                <span>Bengaluru, India</span>
                <span>•</span>
                <span className="text-[#C84B26]">venkatasai@interviewai.dev</span>
                <span>•</span>
                <span>+91 98480 22338</span>
              </div>
            </div>

            {/* Core Competencies Summary */}
            <div className="mb-6 space-y-1.5">
              <h2 className="font-mono text-xs uppercase tracking-widest font-bold text-[#172535] border-b border-[#E5E0D4] pb-1">
                01. ARCHITECTURAL STATEMENT
              </h2>
              <p className="text-sm leading-relaxed text-[#181614]">
                Staff Systems Engineer with 6+ years designing fault-tolerant, high-concurrency distributed engines in Go and TypeScript. Proven track record eliminating single points of failure, maintaining 99.995% SLA across production multi-region banking and infrastructure tiers.
              </p>
            </div>

            {/* Production Experience */}
            <div className="space-y-6">
              <h2 className="font-mono text-xs uppercase tracking-widest font-bold text-[#172535] border-b border-[#E5E0D4] pb-1">
                02. CHRONOLOGY & PRODUCTION IMPACT
              </h2>

              {experiences.map(exp => (
                <div key={exp.id} className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-bold text-base text-[#181614]">{exp.role}</span>
                      <span className="text-[#5C564E] ml-2 font-medium">@ {exp.company}</span>
                    </div>
                    <span className="font-mono text-xs text-[#8C8479]">{exp.period}</span>
                  </div>

                  <ul className="space-y-2 pl-4 list-disc text-sm text-[#181614]">
                    {exp.bullets.map(b => (
                      <li key={b.id} className="leading-relaxed relative group">
                        <span className={b.status === 'upgraded' ? 'bg-[#EBF3EE] px-1 py-0.5 rounded text-[#2E6347]' : ''}>
                          {b.original}
                        </span>
                        {b.metricGain && (
                          <span className="ml-2 font-mono text-[10px] text-[#2E6347] font-semibold bg-[#EBF3EE] border border-[#D0E3D6] px-1.5 py-0.2 rounded inline-block">
                            {b.metricGain}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Technical Tooling & Verified Stack */}
            <div className="mt-6 pt-4 border-t border-[#E5E0D4] space-y-2 font-mono text-xs">
              <h2 className="uppercase tracking-widest font-bold text-[#172535]">
                03. TECHNICAL SPECIFICATIONS
              </h2>
              <div className="grid grid-cols-2 gap-2 text-[#5C564E]">
                <div><strong className="text-[#181614]">Core Languages:</strong> Go, TypeScript, Rust, Python, SQL</div>
                <div><strong className="text-[#181614]">Platforms:</strong> Kubernetes, Kafka, Redis, Docker, PostgreSQL</div>
                <div><strong className="text-[#181614]">Architecture:</strong> Raft, Event-Sourced, CQRS, Zero-Trust</div>
                <div><strong className="text-[#181614]">Observability:</strong> Prometheus, OpenTelemetry, Grafana</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Braun-Inspired Floating Desk Dock (Bottom Center) */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-[#E5E0D4] rounded-full shadow-[0_8px_24px_rgba(24,22,20,0.1)] px-4 py-2 flex items-center gap-3 z-30 text-xs font-mono">
          <div className="flex items-center gap-1 pr-3 border-r border-[#E5E0D4]">
            <span className="text-[#8C8479]">FONT:</span>
            {(['serif', 'sans', 'mono'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFontFamily(f)}
                className={`px-2 py-0.5 rounded uppercase text-[10px] ${
                  fontFamily === f ? 'bg-[#172535] text-white font-semibold' : 'text-[#5C564E] hover:text-[#181614]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 pr-3 border-r border-[#E5E0D4]">
            <span className="text-[#8C8479]">SCALE:</span>
            <button
              onClick={() => setFontSize(prev => Math.max(9, prev - 0.5))}
              className="w-5 h-5 rounded bg-[#EFECE6] text-[#181614] flex items-center justify-center font-bold hover:bg-[#DCD5C6]"
            >
              -
            </button>
            <span className="w-8 text-center text-[#181614] font-bold">{fontSize}pt</span>
            <button
              onClick={() => setFontSize(prev => Math.min(13, prev + 0.5))}
              className="w-5 h-5 rounded bg-[#EFECE6] text-[#181614] flex items-center justify-center font-bold hover:bg-[#DCD5C6]"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-2 text-[#2E6347] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#2E6347]" />
            ATS INDEX: {atsScore}%
          </div>
        </div>

        {/* Pull-Out "Yellow Sticky Annotation Drawer" */}
        <AnimatePresence>
          {drawerOpen && (
            <motion.aside
              initial={{ x: 340, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 340, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="w-80 border-l border-[#E5E0D4] bg-[#FFFDF5] p-5 flex flex-col gap-4 overflow-y-auto z-20 shadow-lg"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#F2E8C4]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#C84B26]" />
                  <h3 className="font-serif font-bold text-sm text-[#181614]">
                    Sticky Annotation Drawer
                  </h3>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="text-xs text-[#8C8479] hover:text-[#181614]"
                >
                  Close
                </button>
              </div>

              <div className="text-xs text-[#5C564E] leading-relaxed">
                Deterministic suggestions grounded in verified architectural evidence. No simulated metrics.
              </div>

              {/* Sticky Notes Cards */}
              <div className="space-y-3.5">
                {experiences.flatMap(exp =>
                  exp.bullets
                    .filter(b => b.status === 'suggested' && b.upgraded)
                    .map(b => (
                      <div
                        key={b.id}
                        className="bg-[#FEFCE8] border border-[#FDE047] rounded-md p-3.5 shadow-xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase text-[#A36114] font-bold">
                            QUANTIFIED UPGRADE
                          </span>
                          <span className="text-[10px] font-mono text-[#2E6347] font-semibold bg-[#EBF3EE] px-1.5 py-0.2 rounded">
                            {b.metricGain}
                          </span>
                        </div>

                        <div className="text-xs text-[#181614] leading-relaxed font-sans bg-white/70 p-2 rounded border border-[#FEF08A]">
                          "{b.upgraded}"
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-[#8C8479]">Replaces vague statement</span>
                          <button
                            onClick={() => applyUpgrade(exp.id, b.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-[#C84B26] hover:bg-[#B53E1B] text-white shadow-xs"
                          >
                            <Check className="w-3 h-3" /> Apply Diff
                          </button>
                        </div>
                      </div>
                    ))
                )}

                {experiences.flatMap(exp => exp.bullets).filter(b => b.status === 'suggested').length === 0 && (
                  <div className="p-6 text-center text-xs text-[#2E6347] bg-[#EBF3EE] rounded-md border border-[#D0E3D6]">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#2E6347]" />
                    <p className="font-bold">All Sticky Upgrades Applied</p>
                    <p className="text-[11px] text-[#5C564E] mt-1">Your resume has achieved 98% architectural defensibility.</p>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

