import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Kanban, Plus, MoreHorizontal, Building2, MapPin, DollarSign,
  Calendar, CheckCircle2, ChevronRight, ArrowRight, ShieldCheck,
  Clock, ExternalLink, SlidersHorizontal
} from 'lucide-react';
import { MechanicalButton } from '../components/ui/MechanicalButton';
import { InkBleedButton } from '../components/ui/InkBleedButton';

interface PipelineCard {
  id: string;
  catalogId: string;
  company: string;
  role: string;
  salary: string;
  location: string;
  stage: '01 DISCOVERED' | '02 TAILORED' | '03 SUBMITTED' | '04 INTERVIEWING' | '05 OFFER';
  fitScore: number;
  readinessState: 'STRONGLY_READY' | 'READY' | 'NEEDS_PREPARATION';
  lastActivity: string;
  nextStep: string;
}

const LANES = [
  '01 DISCOVERED',
  '02 TAILORED',
  '03 SUBMITTED',
  '04 INTERVIEWING',
  '05 OFFER'
] as const;

export default function ApplicationCardCatalogPage() {
  const navigate = useNavigate();

  const [cards, setCards] = useState<PipelineCard[]>([
    {
      id: 'c-1',
      catalogId: 'CAT-1029',
      company: 'Stripe Engineering',
      role: 'Staff Distributed Systems Architect',
      salary: '₹48L - ₹65L',
      location: 'Bengaluru / Hybrid',
      stage: '04 INTERVIEWING',
      fitScore: 94,
      readinessState: 'STRONGLY_READY',
      lastActivity: '2h ago',
      nextStep: 'System Design Round w/ VP Eng (Thu)'
    },
    {
      id: 'c-2',
      catalogId: 'CAT-0941',
      company: 'Linear Labs',
      role: 'Lead Full-Stack Product Engineer',
      salary: '₹38L - ₹52L',
      location: 'Remote',
      stage: '03 SUBMITTED',
      fitScore: 91,
      readinessState: 'READY',
      lastActivity: '1d ago',
      nextStep: 'Technical Screen Scheduled'
    },
    {
      id: 'c-3',
      catalogId: 'CAT-0812',
      company: 'Anthropic Research',
      role: 'Principal AI Reliability Lead',
      salary: '₹60L - ₹85L',
      location: 'Bengaluru',
      stage: '02 TAILORED',
      fitScore: 88,
      readinessState: 'NEEDS_PREPARATION',
      lastActivity: '3d ago',
      nextStep: 'Submit via Internal Referral'
    },
    {
      id: 'c-4',
      catalogId: 'CAT-0703',
      company: 'Databricks',
      role: 'Staff Data Platform Engineer',
      salary: '₹42L - ₹58L',
      location: 'Hyderabad',
      stage: '01 DISCOVERED',
      fitScore: 85,
      readinessState: 'READY',
      lastActivity: '5d ago',
      nextStep: 'Generate Tailored Blueprint'
    },
    {
      id: 'c-5',
      catalogId: 'CAT-0622',
      company: 'Razorpay Labs',
      role: 'Distinguished Architect',
      salary: '₹75L - ₹90L',
      location: 'Bengaluru',
      stage: '05 OFFER',
      fitScore: 97,
      readinessState: 'STRONGLY_READY',
      lastActivity: 'Yesterday',
      nextStep: 'Review Equity Compensation & Sign'
    }
  ]);

  const moveCard = (id: string, newStage: PipelineCard['stage']) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, stage: newStage } : c));
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#181614] flex flex-col font-sans">
      {/* Rack Control Header */}
      <header className="border-b border-[#E5E0D4] bg-white px-6 py-4 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#172535] bg-[#EFECE6] px-2 py-0.5 rounded border border-[#DCD5C6]">
                CRM RACK v2.1
              </span>
              <span className="text-xs font-mono text-[#8C8479]">INDEXED RUNWAYS: {cards.length} OPPORTUNITIES</span>
            </div>
            <h1 className="text-xl font-serif font-bold text-[#181614] tracking-tight mt-1">
              Application Card Catalog Rack
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <MechanicalButton
              variant="vermilion"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/jobs')}
            >
              Add Opportunity Index Slip
            </MechanicalButton>
          </div>
        </div>
      </header>

      {/* Manila Folder Tabbed Kanban Rack */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 overflow-x-auto">
        <div className="flex gap-5 min-w-[1100px] items-start pb-6">
          {LANES.map((lane, laneIdx) => {
            const laneCards = cards.filter(c => c.stage === lane);

            return (
              <div key={lane} className="flex-1 flex flex-col min-w-[220px]">
                {/* Manila Folder Top Index Tab */}
                <div className="bg-[#FAF8F5] border-t-2 border-x border-[#E5E0D4] rounded-t-md px-3.5 py-2 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#181614] tracking-tight">
                    {lane}
                  </span>
                  <span className="font-mono text-[10px] bg-[#EFECE6] px-1.5 py-0.5 rounded text-[#5C564E] font-semibold">
                    {laneCards.length}
                  </span>
                </div>

                {/* Manila Lane Body */}
                <div className="bg-[#FAF8F5]/50 border border-[#E5E0D4] rounded-b-md p-3 space-y-3 min-h-[520px]">
                  {laneCards.map(card => (
                    <motion.div
                      key={card.id}
                      layout
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.15 }}
                      className="bg-white border border-[#E5E0D4] rounded-md p-3.5 shadow-[0_1px_3px_rgba(24,22,20,0.04)] hover:shadow-md transition-all relative overflow-hidden group"
                    >
                      {/* Corner Readiness Notch */}
                      <div
                        className={`absolute top-0 right-0 w-3 h-3 ${
                          card.readinessState === 'STRONGLY_READY'
                            ? 'bg-[#2E6347]'
                            : card.readinessState === 'READY'
                            ? 'bg-[#A36114]'
                            : 'bg-[#9E2A2B]'
                        }`}
                        title={`Readiness State: ${card.readinessState}`}
                      />

                      <div className="text-[10px] font-mono text-[#8C8479] mb-1">
                        {card.catalogId} • FIT: <strong className="text-[#C84B26]">{card.fitScore}%</strong>
                      </div>

                      <h4 className="font-serif font-bold text-sm text-[#181614] leading-snug">
                        {card.role}
                      </h4>

                      <div className="text-xs text-[#5C564E] font-medium mt-1 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#8C8479]" /> {card.company}
                      </div>

                      <div className="text-[11px] font-mono text-[#A36114] bg-[#FDF6E9] px-1.5 py-0.5 rounded border border-[#F7E6C4] mt-2 inline-block">
                        {card.salary}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#E5E0D4] text-[11px] text-[#5C564E]">
                        <span className="font-bold text-[#181614]">Next:</span> {card.nextStep}
                      </div>

                      {/* Quick Move Trigger */}
                      <div className="mt-3 pt-2 border-t border-[#E5E0D4] flex items-center justify-between">
                        <span className="text-[10px] text-[#8C8479]">{card.lastActivity}</span>
                        {laneIdx < LANES.length - 1 && (
                          <button
                            onClick={() => moveCard(card.id, LANES[laneIdx + 1])}
                            className="text-[10px] font-mono font-semibold text-[#C84B26] hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            Advance <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {laneCards.length === 0 && (
                    <div className="py-12 text-center text-xs text-[#8C8479] font-mono border border-dashed border-[#DCD5C6] rounded-md">
                      SLOT VACANT
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

