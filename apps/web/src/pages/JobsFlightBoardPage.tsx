import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Search, Filter, Bookmark, BookmarkCheck, ExternalLink,
  Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Clock, MapPin,
  Building2, X, ChevronRight, Gauge, Sliders, ShieldCheck, FileText
} from 'lucide-react';
import { ApiClient } from '../lib/api';
import { MechanicalButton } from '../components/ui/MechanicalButton';
import { InkBleedButton } from '../components/ui/InkBleedButton';
import { MorphingActionPill } from '../components/ui/MorphingActionPill';

interface FlightJob {
  id: string;
  ticketNo: string;
  title: string;
  company: string;
  location: string;
  mode: 'REMOTE' | 'HYBRID' | 'ONSITE';
  salary: string;
  postedAgo: string;
  matchScore: number;
  whyFit: string[];
  gaps: string[];
  tags: string[];
  department: string;
  applyUrl: string;
}

const CURATED_FLIGHT_JOBS: FlightJob[] = [
  {
    id: 'flt-01',
    ticketNo: 'TKT-8921',
    title: 'Senior Distributed Systems Architect',
    company: 'Stripe Engineering',
    location: 'Bengaluru / Hybrid',
    mode: 'HYBRID',
    salary: '₹48L - ₹65L PA',
    postedAgo: '3h ago',
    matchScore: 94,
    department: 'Core Infrastructure',
    tags: ['Go', 'Raft', 'Kubernetes', 'High-Throughput'],
    whyFit: [
      'Verified experience scaling multi-region consensus engines',
      'Production mastery of Go microservices and gRPC streaming',
      'Quantified 99.995% SLA delivery in previous architecture role'
    ],
    gaps: [
      'Pivoting from AWS to hybrid bare-metal provisioning',
      'Erlang legacy subsystem debugging not explicitly highlighted'
    ],
    applyUrl: 'https://stripe.com/jobs'
  },
  {
    id: 'flt-02',
    ticketNo: 'TKT-7430',
    title: 'Lead Full-Stack Product Engineer',
    company: 'Linear Labs',
    location: 'Remote, India',
    mode: 'REMOTE',
    salary: '₹38L - ₹52L PA',
    postedAgo: '5h ago',
    matchScore: 91,
    department: 'Sync Engine & UI',
    tags: ['TypeScript', 'React 19', 'GraphQL', 'Tailwind', 'WASM'],
    whyFit: [
      'Strong portfolio of optimistic local-first UI architecture',
      'Demonstrated expertise in 60fps micro-interaction physics',
      'Direct match for high-velocity startup engineering rhythm'
    ],
    gaps: [
      'CRDT conflict resolution deep-dive needs interview defensibility'
    ],
    applyUrl: 'https://linear.app/careers'
  },
  {
    id: 'flt-03',
    ticketNo: 'TKT-6102',
    title: 'Principal AI Reliability & Evaluation Lead',
    company: 'Anthropic Research',
    location: 'Bengaluru',
    mode: 'ONSITE',
    salary: '₹60L - ₹85L PA',
    postedAgo: '8h ago',
    matchScore: 88,
    department: 'Safety & Alignment',
    tags: ['Python', 'LLM Eval', 'PyTorch', 'Vector DB', 'Prompt Safety'],
    whyFit: [
      'Hands-on experience building deterministic hallucination guards',
      'Formal background in statistical testing and automated benchmark suites',
      'Published engineering artifacts on truthfulness validation'
    ],
    gaps: [
      'Requires deeper familiarity with Claude constitutional evaluation pipelines'
    ],
    applyUrl: 'https://anthropic.com/careers'
  },
  {
    id: 'flt-04',
    ticketNo: 'TKT-5519',
    title: 'Senior Data Platform & Real-Time Analytics Engineer',
    company: 'Databricks',
    location: 'Hyderabad',
    mode: 'HYBRID',
    salary: '₹42L - ₹58L PA',
    postedAgo: '14h ago',
    matchScore: 85,
    department: 'Lakehouse Core',
    tags: ['Apache Spark', 'Delta Lake', 'Scala', 'PySpark', 'Iceberg'],
    whyFit: [
      'Proven expertise tuning multi-terabyte query execution plans',
      'Strong proficiency with parquet columnar storage optimizations'
    ],
    gaps: [
      'Scala runtime internals can be sharpened in STAR story bank'
    ],
    applyUrl: 'https://databricks.com/careers'
  }
];

export default function JobsFlightBoardPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('ALL');
  const [selectedJob, setSelectedJob] = useState<FlightJob | null>(CURATED_FLIGHT_JOBS[0]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set(['flt-01']));
  const [inspectorTab, setInspectorTab] = useState<'fit' | 'gaps'>('fit');
  const [tailorState, setTailorState] = useState<'idle' | 'executing' | 'success'>('idle');

  // Load from API with fallback to curated data
  const { data: apiJobs } = useQuery({
    queryKey: ['jobs', searchTerm],
    queryFn: () => ApiClient.getJobs({ search: searchTerm }),
    staleTime: 60000,
  });

  const allJobs: FlightJob[] = React.useMemo(() => {
    if (apiJobs && Array.isArray(apiJobs.data) && apiJobs.data.length > 0) {
      return apiJobs.data.slice(0, 15).map((j: any, idx: number) => ({
        id: j.id || `api-${idx}`,
        ticketNo: `TKT-${8000 + idx}`,
        title: j.title || 'Senior Software Engineer',
        company: j.company_name || 'Enterprise Engineering',
        location: j.location || 'India',
        mode: j.work_mode?.toUpperCase() === 'REMOTE' ? 'REMOTE' : 'HYBRID',
        salary: j.salary_min ? `₹${(j.salary_min / 100000).toFixed(0)}L - ₹${(j.salary_max / 100000).toFixed(0)}L PA` : 'Competitive',
        postedAgo: 'Today',
        matchScore: Math.floor(82 + (idx % 15)),
        department: 'Engineering',
        tags: Array.isArray(j.skills) && j.skills.length > 0 ? j.skills.slice(0, 4) : ['TypeScript', 'Node.js', 'System Design'],
        whyFit: [
          'Direct alignment with foundational backend and architectural competencies',
          'Quantified impact in production distributed environments'
        ],
        gaps: [
          'Specific domain-specific SLA metrics to be reinforced in tailored resume'
        ],
        applyUrl: j.apply_url || 'https://linkedin.com/jobs'
      }));
    }
    return CURATED_FLIGHT_JOBS;
  }, [apiJobs]);

  const filteredJobs = allJobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMode = selectedMode === 'ALL' || job.mode === selectedMode;
    return matchesSearch && matchesMode;
  });

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedJobIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTailorAction = () => {
    setTailorState('executing');
    setTimeout(() => {
      setTailorState('success');
      setTimeout(() => {
        if (selectedJob) {
          navigate(`/resume/studio?tailorFor=${selectedJob.id}`);
        }
      }, 700);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#181614] flex flex-col font-sans">
      {/* Flight Control Header Banner */}
      <header className="border-b border-[#E5E0D4] bg-white px-6 py-4 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C84B26] font-semibold bg-[#FBF0EC] px-2 py-0.5 rounded border border-[#F4D4C9]">
                TELEMETRY FEED
              </span>
              <span className="text-xs font-mono text-[#8C8479]">CHANNEL: ASIA-SOUTH-1</span>
            </div>
            <h1 className="text-xl font-serif font-bold text-[#181614] tracking-tight mt-1">
              Flight Board & Ticket Feed
            </h1>
            <p className="text-xs text-[#5C564E]">
              Precision career index slips parsed against your verified engineering competencies.
            </p>
          </div>

          {/* Air Traffic Switchboard Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8479]" />
              <input
                type="text"
                placeholder="Search ticket title or stack..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-[#F5F3EE] border border-[#E5E0D4] rounded-md focus:border-[#C84B26] focus:outline-none w-52 text-[#181614] placeholder-[#8C8479]"
              />
            </div>

            <div className="flex items-center bg-[#F5F3EE] p-0.5 rounded-md border border-[#E5E0D4] text-xs font-mono">
              {['ALL', 'REMOTE', 'HYBRID', 'ONSITE'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSelectedMode(mode)}
                  className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                    selectedMode === mode
                      ? 'bg-white text-[#181614] font-semibold shadow-xs border border-[#E5E0D4]'
                      : 'text-[#8C8479] hover:text-[#181614]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Split Layout: Flight Slips Feed + Telemetry Inspector */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col lg:flex-row gap-6">
        {/* Left: The Boarding Pass Ticket Feed */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-[#8C8479] px-1">
            <span>INDEX SLIPS ({filteredJobs.length} ACTIVE RUNWAYS)</span>
            <span>SORT: FIT CONFIDENCE DESC</span>
          </div>

          <div className="space-y-3.5">
            {filteredJobs.map((job) => {
              const isSelected = selectedJob?.id === job.id;
              const isSaved = savedJobIds.has(job.id);

              return (
                <motion.div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.15 }}
                  className={`relative cursor-pointer bg-white border rounded-lg transition-all duration-200 overflow-hidden ${
                    isSelected
                      ? 'border-[#C84B26] shadow-[0_4px_16px_rgba(200,75,38,0.08)] ring-1 ring-[#C84B26]/30'
                      : 'border-[#E5E0D4] hover:border-[#D5CEBF] shadow-[0_1px_3px_rgba(24,22,20,0.04)]'
                  }`}
                >
                  {/* Left Notch / Perforated Boarding Pass Header */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] font-semibold text-[#172535] bg-[#EFECE6] px-2 py-0.5 rounded border border-[#DCD5C6]">
                          {job.ticketNo}
                        </span>
                        <span className="text-[10px] font-mono text-[#8C8479]">
                          [Fresh: {job.postedAgo}]
                        </span>
                        <span className="text-[10px] font-mono text-[#2E6347] bg-[#EBF3EE] px-1.5 py-0.5 rounded border border-[#D0E3D6]">
                          [Mode: {job.mode}]
                        </span>
                        <span className="text-[10px] font-mono text-[#A36114] bg-[#FDF6E9] px-1.5 py-0.5 rounded border border-[#F7E6C4]">
                          [Salary: {job.salary}]
                        </span>
                      </div>

                      <h3 className="font-serif font-bold text-base text-[#181614] tracking-tight hover:text-[#C84B26] transition-colors">
                        {job.title}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-[#5C564E]">
                        <span className="font-medium text-[#181614] flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-[#8C8479]" /> {job.company}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#8C8479]" /> {job.location}
                        </span>
                      </div>
                    </div>

                    {/* Flight Match Telemetry Badge */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E5E0D4]">
                      <div className="text-right">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-[#8C8479]">
                          Match Index
                        </div>
                        <div className="text-xl font-serif font-bold text-[#C84B26]">
                          {job.matchScore}%
                        </div>
                      </div>

                      <button
                        onClick={(e) => toggleSave(job.id, e)}
                        className={`p-1.5 rounded-md border transition-colors ${
                          isSaved
                            ? 'bg-[#FBF0EC] border-[#F4D4C9] text-[#C84B26]'
                            : 'bg-white border-[#E5E0D4] text-[#8C8479] hover:text-[#181614]'
                        }`}
                        title={isSaved ? "Saved slip" : "Save slip"}
                      >
                        {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Perforated Separator Line */}
                  <div className="perforated-h w-full" />

                  {/* Flight Slip Stub Footer */}
                  <div className="px-4 sm:px-5 py-2.5 bg-[#FAF8F5] flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {job.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded bg-white border border-[#E5E0D4] text-[10px] font-mono text-[#5C564E]">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-medium text-[#C84B26] hover:underline flex items-center gap-1">
                        Inspect Telemetry <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: Flight Telemetry Inspector (Slide-out physical instrument) */}
        {selectedJob && (
          <aside className="w-full lg:w-96 shrink-0 bg-white border border-[#E5E0D4] rounded-lg shadow-sm p-5 flex flex-col gap-5 sticky top-24 self-start">
            {/* Instrument Header */}
            <div className="pb-4 border-b border-[#E5E0D4]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-semibold text-[#172535] bg-[#EFECE6] px-2 py-0.5 rounded border border-[#DCD5C6]">
                  RADAR INSPECTOR
                </span>
                <span className="text-[11px] font-mono text-[#8C8479]">{selectedJob.ticketNo}</span>
              </div>
              <h2 className="font-serif font-bold text-lg text-[#181614] tracking-tight">
                {selectedJob.title}
              </h2>
              <div className="text-xs text-[#5C564E] mt-0.5">
                {selectedJob.company} • {selectedJob.location}
              </div>
            </div>

            {/* Analog-Inspired Match Needle Gauge */}
            <div className="bg-[#FAF8F5] border border-[#E5E0D4] rounded-lg p-4 text-center">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#8C8479] mb-1">
                COMPETENCY RELEVANCE GAUGE
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="relative w-28 h-14 overflow-hidden flex items-end justify-center">
                  {/* Gauge Arc Background */}
                  <div className="w-28 h-28 rounded-full border-8 border-[#E5E0D4] border-t-[#C84B26] border-r-[#C84B26] rotate-[-45deg]" />
                  {/* Digital readout center */}
                  <div className="absolute font-serif font-bold text-2xl text-[#181614]">
                    {selectedJob.matchScore}%
                  </div>
                </div>
              </div>
              <div className="text-xs text-[#2E6347] font-medium mt-2 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> High Defensibility Match
              </div>
            </div>

            {/* Split Switcher: Why Fit vs. Gaps */}
            <div className="flex rounded-md border border-[#E5E0D4] p-0.5 bg-[#F5F3EE] text-xs font-mono">
              <button
                onClick={() => setInspectorTab('fit')}
                className={`flex-1 py-1.5 rounded transition-colors ${
                  inspectorTab === 'fit'
                    ? 'bg-white text-[#181614] font-semibold shadow-xs'
                    : 'text-[#8C8479] hover:text-[#181614]'
                }`}
              >
                WHY FIT ({selectedJob.whyFit.length})
              </button>
              <button
                onClick={() => setInspectorTab('gaps')}
                className={`flex-1 py-1.5 rounded transition-colors ${
                  inspectorTab === 'gaps'
                    ? 'bg-white text-[#9E2A2B] font-semibold shadow-xs'
                    : 'text-[#8C8479] hover:text-[#181614]'
                }`}
              >
                GAPS ({selectedJob.gaps.length})
              </button>
            </div>

            {/* Tab Content */}
            <div className="space-y-2.5 flex-1 min-h-[140px]">
              {inspectorTab === 'fit' ? (
                <div className="space-y-2">
                  {selectedJob.whyFit.map((pt, i) => (
                    <div key={i} className="p-2.5 rounded bg-[#EBF3EE] border border-[#D0E3D6] text-xs text-[#2E6347] flex items-start gap-2 leading-relaxed">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6347] shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedJob.gaps.map((pt, i) => (
                    <div key={i} className="p-2.5 rounded bg-[#FDF6E9] border border-[#F7E6C4] text-xs text-[#A36114] flex items-start gap-2 leading-relaxed">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#A36114] shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Bar with Mechanical Buttons */}
            <div className="pt-4 border-t border-[#E5E0D4] space-y-2.5">
              <MechanicalButton
                variant="vermilion"
                size="md"
                className="w-full"
                icon={<FileText className="w-4 h-4" />}
                onClick={handleTailorAction}
              >
                {tailorState === 'executing' ? 'Drafting Blueprint...' : 'Tailor Architect Resume'}
              </MechanicalButton>

              <div className="flex gap-2">
                <InkBleedButton
                  className="flex-1"
                  onClick={() => window.open(selectedJob.applyUrl, '_blank')}
                  icon={<ExternalLink className="w-3.5 h-3.5" />}
                >
                  Direct Apply
                </InkBleedButton>
                <MechanicalButton
                  variant="navy"
                  size="sm"
                  className="px-3"
                  onClick={() => navigate(`/interview/session/${selectedJob.id}`)}
                  title="Practice broadcast mock interview for this flight"
                >
                  Simulate
                </MechanicalButton>
              </div>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}

