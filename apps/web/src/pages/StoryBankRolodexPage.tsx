import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Plus, Search, Tag, Check, Award, ChevronRight,
  Bookmark, Edit3, ArrowRight, CornerDownRight, BarChart2
} from 'lucide-react';
import { MechanicalButton } from '../components/ui/MechanicalButton';
import { InkBleedButton } from '../components/ui/InkBleedButton';
import { MorphingActionPill } from '../components/ui/MorphingActionPill';

interface StarStory {
  id: string;
  indexCode: string;
  title: string;
  competency: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  highlightMetric: string;
  verified: boolean;
  tags: string[];
}

export default function StoryBankRolodexPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');

  const [stories, setStories] = useState<StarStory[]>([
    {
      id: 'st-01',
      indexCode: 'ROL-881',
      title: 'Resolving Distributed Consensus Deadlock Under 450k req/sec',
      competency: 'System Reliability & Concurrency',
      situation: 'Production Raft cluster experienced split-brain election flapping during cross-zone fibre cut.',
      task: 'Restore single-leader authority and drain blocked transaction queues without dropping in-flight payments.',
      action: 'Engineered a quorum-fencing heartbeat patch in Go with bounded exponential backoff on stale terms.',
      result: 'Recovered cluster within 180ms with zero message drops and 99.995% SLA preserved.',
      highlightMetric: '180ms failover • 0 lost events',
      verified: true,
      tags: ['Distributed Systems', 'Go', 'Incident Response', 'High-Stakes']
    },
    {
      id: 'st-02',
      indexCode: 'ROL-882',
      title: 'Negotiating Technical Debt Refactor vs. Feature Freeze with VP Product',
      competency: 'Cross-Functional Executive Negotiation',
      situation: 'Monolithic Postgres database was exhausting IOPS due to unindexed payment webhook history.',
      task: 'Convince leadership to allocate a 3-week engineering sprint to partition tables despite Q4 product roadmap pressure.',
      action: 'Prepared an empirical telemetry deck modeling cascading outage probabilities and revenue exposure ($4.2M).',
      result: 'Secured unanimous executive sponsorship; completed non-blocking table partitioning with 40% IOPS reduction.',
      highlightMetric: '-40% IOPS • $4.2M protected',
      verified: true,
      tags: ['Leadership', 'Negotiation', 'Database', 'Executive']
    },
    {
      id: 'st-03',
      indexCode: 'ROL-883',
      title: 'Mentoring Junior Engineers Through Production Post-Mortems',
      competency: 'Engineering Mentorship & Culture',
      situation: 'New engineer accidentally deployed schema migration causing deadlock on billing tables during peak hours.',
      task: 'Mitigate psychological fear while establishing systemic blameless safeguards.',
      action: 'Led a transparent 5-Whys post-mortem, wrote pre-merge schema linting tooling, and paired on remediation.',
      result: 'Zero recurrence of migration lockups over 18 months; mentee promoted to L5 engineer.',
      highlightMetric: 'Zero repeat incidents • 1 promotion',
      verified: true,
      tags: ['Culture', 'Mentorship', 'CI/CD']
    }
  ]);

  const [injectMetricState, setInjectMetricState] = useState<Record<string, boolean>>({});

  const handleInject = (storyId: string) => {
    setInjectMetricState(prev => ({ ...prev, [storyId]: true }));
    setStories(prev => prev.map(s => {
      if (s.id !== storyId) return s;
      return {
        ...s,
        result: `${s.result} Verified by production Grafana audit logs.`
      };
    }));
  };

  const filteredStories = stories.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.situation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTag = selectedTag === 'ALL' || s.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#181614] flex flex-col font-sans">
      {/* Rolodex Header */}
      <header className="border-b border-[#E5E0D4] bg-white px-6 py-4 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#172535] bg-[#EFECE6] px-2 py-0.5 rounded border border-[#DCD5C6]">
                JOURNALIST'S ROLODEX
              </span>
              <span className="text-xs font-mono text-[#8C8479]">STAR INTERVIEW INVENTORY</span>
            </div>
            <h1 className="text-xl font-serif font-bold text-[#181614] tracking-tight mt-1">
              STAR Story Rolodex
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <MechanicalButton
              variant="vermilion"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
            >
              Draft New STAR Slip
            </MechanicalButton>
          </div>
        </div>
      </header>

      {/* Main Rolodex Feed */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 space-y-6">
        {/* Search & Tag Filter Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3.5 rounded-lg border border-[#E5E0D4]">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8479]" />
            <input
              type="text"
              placeholder="Search by topic, failure mode, or tech..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-[#F5F3EE] border border-[#E5E0D4] rounded-md focus:border-[#C84B26] focus:outline-none w-full text-[#181614]"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
            {['ALL', 'Distributed Systems', 'Leadership', 'Database', 'Culture'].map(t => (
              <button
                key={t}
                onClick={() => setSelectedTag(t)}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  selectedTag === t
                    ? 'bg-[#172535] text-white font-semibold'
                    : 'bg-[#F5F3EE] text-[#5C564E] hover:text-[#181614] border border-[#E5E0D4]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Rolodex Cards */}
        <div className="space-y-6">
          {filteredStories.map(story => (
            <motion.div
              key={story.id}
              layout
              className="bg-white border border-[#E5E0D4] rounded-lg shadow-sm overflow-hidden"
            >
              {/* Index Tab Header */}
              <div className="p-4 sm:p-5 border-b border-[#E5E0D4] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-[#172535] bg-white px-2 py-0.5 rounded border border-[#DCD5C6]">
                      {story.indexCode}
                    </span>
                    <span className="text-[10px] font-mono text-[#8C8479]">COMPETENCY:</span>
                    <span className="text-[11px] font-mono text-[#C84B26] font-semibold">{story.competency}</span>
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#181614] tracking-tight mt-1">
                    {story.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#2E6347] bg-[#EBF3EE] border border-[#D0E3D6] px-2.5 py-1 rounded">
                    ★ {story.highlightMetric}
                  </span>
                </div>
              </div>

              {/* 4-Column Interconnected STAR Sequence */}
              <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E5E0D4] text-xs">
                {/* S - Situation (Muted Navy) */}
                <div className="p-4 sm:p-5 space-y-2 bg-[#F9FAFB]/50">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-[#172535]">
                    <span className="w-4 h-4 rounded bg-[#172535] text-white flex items-center justify-center text-[9px]">S</span>
                    SITUATION
                  </div>
                  <p className="leading-relaxed text-[#5C564E]">
                    {story.situation}
                  </p>
                </div>

                {/* T - Task (Slate) */}
                <div className="p-4 sm:p-5 space-y-2 bg-[#F9FAFB]/50">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-[#5C564E]">
                    <span className="w-4 h-4 rounded bg-[#5C564E] text-white flex items-center justify-center text-[9px]">T</span>
                    TASK
                  </div>
                  <p className="leading-relaxed text-[#5C564E]">
                    {story.task}
                  </p>
                </div>

                {/* A - Action (Warm Terracotta) */}
                <div className="p-4 sm:p-5 space-y-2 bg-[#FBF0EC]/40">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-[#C84B26]">
                    <span className="w-4 h-4 rounded bg-[#C84B26] text-white flex items-center justify-center text-[9px]">A</span>
                    ACTION
                  </div>
                  <p className="leading-relaxed text-[#181614] font-medium">
                    {story.action}
                  </p>
                </div>

                {/* R - Result (Celadon with bold metric) */}
                <div className="p-4 sm:p-5 space-y-2 bg-[#EBF3EE]/40">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-[#2E6347]">
                    <span className="w-4 h-4 rounded bg-[#2E6347] text-white flex items-center justify-center text-[9px]">R</span>
                    RESULT
                  </div>
                  <p className="leading-relaxed text-[#2E6347] font-semibold">
                    {story.result}
                  </p>
                </div>
              </div>

              {/* Base Interactive "Inject Metrics" Prompt Bar */}
              <div className="p-3 sm:px-5 border-t border-[#E5E0D4] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  {story.tags.map(t => (
                    <span key={t} className="text-[10px] font-mono text-[#8C8479] bg-white border border-[#E5E0D4] px-2 py-0.5 rounded">
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleInject(story.id)}
                    className="font-mono text-[11px] text-[#C84B26] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {injectMetricState[story.id] ? 'Metric Anchored' : 'Inject Precision Metric'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}

