import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2, TrendingUp, Compass, Award, ShieldCheck, ChevronRight,
  Target, Activity, Clock, Sliders, ArrowUpRight, Zap
} from 'lucide-react';
import { MechanicalButton } from '../components/ui/MechanicalButton';
import { InkBleedButton } from '../components/ui/InkBleedButton';

export default function CareerSwissChronometerPage() {
  const [timeRange, setTimeRange] = useState<'30D' | '90D' | '1Y'>('90D');

  const funnelSteps = [
    { label: '01. IDENTIFIED RUNWAYS', count: 142, percentage: '100%', note: 'Parsed via Flight Feed' },
    { label: '02. ARCHITECTURAL TAILORING', count: 86, percentage: '60.5%', note: 'ATS Score > 90%' },
    { label: '03. APPLICATIONS DISPATCHED', count: 34, percentage: '23.9%', note: 'Referrals & Direct' },
    { label: '04. TECHNICAL SCREENINGS', count: 12, percentage: '8.4%', note: 'Live Broadcast Sessions' },
    { label: '05. FINAL COMMITTED OFFERS', count: 4, percentage: '2.8%', note: 'Stripe, Razorpay, etc.' },
  ];

  const skillMatrix = [
    { skill: 'Go / Distributed Systems', marketDemand: 96, candidateDefensibility: 94, status: 'DOMINANT' },
    { skill: 'TypeScript / React 19', marketDemand: 92, candidateDefensibility: 91, status: 'DOMINANT' },
    { skill: 'Kubernetes / Cloud Native', marketDemand: 89, candidateDefensibility: 88, status: 'ALIGNED' },
    { skill: 'PostgreSQL Internals & Locks', marketDemand: 85, candidateDefensibility: 86, status: 'ALIGNED' },
    { skill: 'LLM Reliability & Eval Harnesses', marketDemand: 94, candidateDefensibility: 79, status: 'OPPORTUNITY' },
    { skill: 'Kafka / Event Streaming', marketDemand: 88, candidateDefensibility: 84, status: 'ALIGNED' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#181614] flex flex-col font-sans">
      {/* Swiss Chronometer Top Bar */}
      <header className="border-b border-[#E5E0D4] bg-white px-6 py-4 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#172535] bg-[#EFECE6] px-2 py-0.5 rounded border border-[#DCD5C6]">
                TELEMETRY DECK v4.0
              </span>
              <span className="text-xs font-mono text-[#8C8479]">CALIBRATION: SWISS CHRONOMETER GRADE</span>
            </div>
            <h1 className="text-xl font-serif font-bold text-[#181614] tracking-tight mt-1">
              AI Career Swiss Chronometer Deck
            </h1>
          </div>

          <div className="flex items-center bg-[#F5F3EE] p-0.5 rounded-md border border-[#E5E0D4] text-xs font-mono">
            {(['30D', '90D', '1Y'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1 rounded text-[11px] transition-colors ${
                  timeRange === t
                    ? 'bg-white text-[#181614] font-semibold shadow-xs border border-[#E5E0D4]'
                    : 'text-[#8C8479] hover:text-[#181614]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Swiss Grid */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 space-y-8">
        {/* Top 3 Chronometer Metric Instruments */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Instrument 1: Offer Probability Index */}
          <div className="bg-white border border-[#E5E0D4] rounded-lg p-6 shadow-xs relative overflow-hidden">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#8C8479]">
              CHRONOMETER INDEX 01
            </div>
            <div className="text-xs font-bold text-[#172535] mt-1">
              Offer Conversion Probability
            </div>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-4xl font-serif font-bold text-[#C84B26]">84.2%</span>
              <span className="text-xs font-mono text-[#2E6347] font-semibold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +6.8%
              </span>
            </div>
            <p className="text-xs text-[#5C564E] mt-2">
              Based on 34 tailored applications & 12 broadcast mock sessions.
            </p>
          </div>

          {/* Instrument 2: Defensibility Index */}
          <div className="bg-white border border-[#E5E0D4] rounded-lg p-6 shadow-xs relative overflow-hidden">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#8C8479]">
              CHRONOMETER INDEX 02
            </div>
            <div className="text-xs font-bold text-[#172535] mt-1">
              Architectural Defensibility
            </div>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-4xl font-serif font-bold text-[#172535]">98/100</span>
              <span className="text-xs font-mono text-[#2E6347] font-semibold bg-[#EBF3EE] px-1.5 py-0.5 rounded">
                TIER-1 ATS
              </span>
            </div>
            <p className="text-xs text-[#5C564E] mt-2">
              Zero hallucinated metrics across all active drafting blueprints.
            </p>
          </div>

          {/* Instrument 3: Market Velocity */}
          <div className="bg-white border border-[#E5E0D4] rounded-lg p-6 shadow-xs relative overflow-hidden">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#8C8479]">
              CHRONOMETER INDEX 03
            </div>
            <div className="text-xs font-bold text-[#172535] mt-1">
              Average Runway Velocity
            </div>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-4xl font-serif font-bold text-[#2E6347]">14.2 Days</span>
              <span className="text-xs font-mono text-[#8C8479]">From Slip to Screen</span>
            </div>
            <p className="text-xs text-[#5C564E] mt-2">
              Outpacing national tech average by 3.2x speedup.
            </p>
          </div>
        </div>

        {/* Architectural Step-Down Conversion Funnel */}
        <div className="bg-white border border-[#E5E0D4] rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5E0D4] pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C8479]">
                ARCHITECTURAL STEP-DOWN DIAGRAM
              </span>
              <h2 className="font-serif font-bold text-lg text-[#181614] tracking-tight mt-0.5">
                Full-Funnel Pipeline Conversion Telemetry
              </h2>
            </div>
            <span className="text-xs font-mono text-[#8C8479]">PRECISION TELEMETRY</span>
          </div>

          <div className="space-y-3">
            {funnelSteps.map((step, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-[#181614]">{step.label}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-[#8C8479] hidden sm:inline">{step.note}</span>
                    <span className="font-bold text-[#181614]">{step.count} ({step.percentage})</span>
                  </div>
                </div>

                <div className="w-full h-3 bg-[#F5F3EE] rounded-sm overflow-hidden border border-[#E5E0D4]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: step.percentage }}
                    transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
                    className={`h-full ${
                      idx === 4 ? 'bg-[#2E6347]' : idx === 0 ? 'bg-[#172535]' : 'bg-[#C84B26]'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monospace Skill Matrix: Market Demand vs. Defensibility */}
        <div className="bg-white border border-[#E5E0D4] rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5E0D4] pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C8479]">
                MONOSPACE COMPETENCY CALIBRATION
              </span>
              <h2 className="font-serif font-bold text-lg text-[#181614] tracking-tight mt-0.5">
                Market Demand vs. Candidate Defensibility Matrix
              </h2>
            </div>
            <span className="text-xs font-mono text-[#2E6347] font-semibold">ALL SENSORS LIVE</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#E5E0D4] text-[#8C8479]">
                  <th className="pb-3 font-semibold">COMPETENCY ARCHETYPE</th>
                  <th className="pb-3 font-semibold">INDUSTRY DEMAND</th>
                  <th className="pb-3 font-semibold">CANDIDATE DEFENSE</th>
                  <th className="pb-3 font-semibold">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D4]">
                {skillMatrix.map((item, i) => (
                  <tr key={i} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3 font-medium text-[#181614]">{item.skill}</td>
                    <td className="py-3 text-[#5C564E]">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-[#EFECE6] rounded-full overflow-hidden">
                          <div className="h-full bg-[#172535]" style={{ width: `${item.marketDemand}%` }} />
                        </div>
                        <span>{item.marketDemand}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-[#5C564E]">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-[#EFECE6] rounded-full overflow-hidden">
                          <div className="h-full bg-[#C84B26]" style={{ width: `${item.candidateDefensibility}%` }} />
                        </div>
                        <span className="font-bold text-[#181614]">{item.candidateDefensibility}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.status === 'DOMINANT'
                          ? 'bg-[#EBF3EE] text-[#2E6347] border border-[#D0E3D6]'
                          : item.status === 'ALIGNED'
                          ? 'bg-[#FAF8F5] text-[#172535] border border-[#DCD5C6]'
                          : 'bg-[#FDF6E9] text-[#A36114] border border-[#F7E6C4]'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

