import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Kanban, Plus, MoreHorizontal, Building2, MapPin, DollarSign,
  Calendar, CheckCircle2, ChevronRight, ArrowRight, ShieldCheck,
  Clock, ExternalLink, SlidersHorizontal, RefreshCw
} from 'lucide-react';
import { ApiClient } from '../lib/api';
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

const mapStatusToLane = (status?: string): PipelineCard['stage'] => {
  if (!status) return '01 DISCOVERED';
  const s = status.toUpperCase();
  if (s.includes('OFFER')) return '05 OFFER';
  if (s.includes('INTERVIEW')) return '04 INTERVIEWING';
  if (s.includes('APPLIED') || s.includes('SUBMITTED')) return '03 SUBMITTED';
  if (s.includes('TAILOR') || s.includes('INTERESTED')) return '02 TAILORED';
  return '01 DISCOVERED';
};

export default function ApplicationCardCatalogPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: appData, isLoading } = useQuery({
    queryKey: ['userApplications'],
    queryFn: () => ApiClient.getUserApplications(),
  });

  const cards: PipelineCard[] = (appData?.applications || []).map((app: any, idx: number) => ({
    id: app.id || app._id || `app-${idx}`,
    catalogId: `APP-${(app.id || app._id || `${idx}`).slice(-4).toUpperCase()}`,
    company: app.job?.company_name || 'Enterprise Engineering',
    role: app.job?.title || 'Software Engineer',
    salary: 'Competitive',
    location: app.job?.location || 'India',
    stage: mapStatusToLane(app.status),
    fitScore: 88,
    readinessState: 'READY',
    lastActivity: app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recent',
    nextStep: app.notes || 'Interview Preparation & Resume Tailoring',
  }));

  const moveMutation = useMutation({
    mutationFn: ({ id, newStage }: { id: string; newStage: string }) =>
      ApiClient.updateUserApplication(id, { status: newStage, stage: newStage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userApplications'] });
    },
  });

  const moveCard = (id: string, newStage: PipelineCard['stage']) => {
    moveMutation.mutate({ id, newStage });
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

