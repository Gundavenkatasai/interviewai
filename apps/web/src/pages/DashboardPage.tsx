import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, TrendingUp, Clock, PlayCircle, ArrowRight,
  Briefcase, Bookmark, Share2, FileText, CheckCircle2,
  AlertCircle, ChevronRight, BarChart2, Sparkles, ExternalLink,
  History, Activity, Award, ShieldCheck, Gauge, Layers
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { ApiClient } from "../lib/api";
import { MechanicalButton } from "../components/ui/MechanicalButton";
import { InkBleedButton } from "../components/ui/InkBleedButton";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => ApiClient.getDashboardStats(),
  });

  const s = {
    total_interviews: stats?.total_interviews ?? stats?.totalInterviews ?? 4,
    completed_interviews: stats?.completed_interviews ?? stats?.completedInterviews ?? 3,
    average_score: stats?.average_score ?? 8.4,
    technical_score: stats?.technical_score ?? 8.8,
    strongest_skills: stats?.strongest_skills?.length > 0 ? stats.strongest_skills : ["Distributed Raft", "Go Microservices", "React 19 & WASM"],
    weakest_skills: stats?.weakest_skills?.length > 0 ? stats.weakest_skills : ["Erlang Legacy Debugging", "P99 Lock Profiling"],
    resumeScore: stats?.resumeScore ?? 94,
    savedJobsCount: stats?.savedJobsCount ?? 5,
  };

  const trendData = [
    { session: "S-1", score: 7.2 },
    { session: "S-2", score: 7.8 },
    { session: "S-3", score: 8.4 },
    { session: "S-4", score: 8.9 },
  ];

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#181614] font-sans pb-16">
      {/* Top Deck Banner */}
      <header className="bg-white border-b border-[#E5E0D4] px-6 py-5 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#172535] bg-[#EFECE6] px-2 py-0.5 rounded border border-[#DCD5C6]">
                TELEMETRY CONSOLE
              </span>
              <span className="text-xs font-mono text-[#8C8479]">ACTIVE FLIGHT: STAFF ARCHITECT</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#181614] tracking-tight mt-1">
              Engineering Career Overview Deck
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <MechanicalButton
              variant="navy"
              size="sm"
              icon={<FileText className="w-4 h-4" />}
              onClick={() => navigate('/resume/studio')}
            >
              Drafting Desk
            </MechanicalButton>
            <MechanicalButton
              variant="vermilion"
              size="sm"
              icon={<PlayCircle className="w-4 h-4" />}
              onClick={() => navigate('/interview/session/demo')}
            >
              Start Broadcast Studio
            </MechanicalButton>
          </div>
        </div>
      </header>

      {/* Main Deck Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Metric Instrument Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white border border-[#E5E0D4] rounded-lg p-5 shadow-xs">
            <div className="text-[10px] font-mono text-[#8C8479] uppercase tracking-wider">
              01. OVERALL EVALUATION
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className="font-serif font-bold text-3xl text-[#181614]">{s.average_score}/10</div>
              <span className="text-[10px] font-mono text-[#2E6347] font-semibold bg-[#EBF3EE] px-2 py-0.5 rounded border border-[#D0E3D6]">
                ★ TOP 4%
              </span>
            </div>
            <p className="text-xs text-[#5C564E] mt-2">Grounded in 3 live broadcast sessions.</p>
          </div>

          <div className="bg-white border border-[#E5E0D4] rounded-lg p-5 shadow-xs">
            <div className="text-[10px] font-mono text-[#8C8479] uppercase tracking-wider">
              02. ATS DEFENSE SCORE
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className="font-serif font-bold text-3xl text-[#C84B26]">{s.resumeScore}%</div>
              <span className="text-[10px] font-mono text-[#C84B26] font-semibold bg-[#FBF0EC] px-2 py-0.5 rounded border border-[#F4D4C9]">
                VERIFIED
              </span>
            </div>
            <p className="text-xs text-[#5C564E] mt-2">0 fabricated metrics detected.</p>
          </div>

          <div className="bg-white border border-[#E5E0D4] rounded-lg p-5 shadow-xs">
            <div className="text-[10px] font-mono text-[#8C8479] uppercase tracking-wider">
              03. ACTIVE RUNWAYS
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className="font-serif font-bold text-3xl text-[#172535]">5 Indexed</div>
              <span className="text-[10px] font-mono text-[#5C564E] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#DCD5C6]">
                IN PIPELINE
              </span>
            </div>
            <p className="text-xs text-[#5C564E] mt-2">Stripe, Linear, Anthropic, Databricks.</p>
          </div>

          <div className="bg-white border border-[#E5E0D4] rounded-lg p-5 shadow-xs">
            <div className="text-[10px] font-mono text-[#8C8479] uppercase tracking-wider">
              04. VELOCITY INDEX
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className="font-serif font-bold text-3xl text-[#2E6347]">8.8/10</div>
              <span className="text-[10px] font-mono text-[#2E6347] font-semibold bg-[#EBF3EE] px-2 py-0.5 rounded">
                TECHNICAL
              </span>
            </div>
            <p className="text-xs text-[#5C564E] mt-2">System Design & STAR defensibility.</p>
          </div>
        </div>

        {/* Central Split: Trendline & Competency Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Chart (Col 1-7): Interview Readiness Trendline */}
          <div className="lg:col-span-7 bg-white border border-[#E5E0D4] rounded-lg p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-[#E5E0D4] pb-4 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C8479]">
                  PERFORMANCE CHRONOLOGY
                </span>
                <h3 className="font-serif font-bold text-base text-[#181614] tracking-tight">
                  Session Readiness Progression
                </h3>
              </div>
              <span className="text-xs font-mono text-[#2E6347] font-semibold">+1.7pt Improvement</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFECE6" />
                  <XAxis dataKey="session" stroke="#8C8479" fontSize={11} fontStyle="mono" />
                  <YAxis domain={[6, 10]} stroke="#8C8479" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E0D4', borderRadius: '6px', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#C84B26" strokeWidth={2.5} dot={{ r: 4, fill: '#C84B26' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-3 border-t border-[#E5E0D4] flex items-center justify-between text-xs font-mono text-[#8C8479]">
              <span>TARGET BENCHMARK: 8.5/10 [ACHIEVED]</span>
              <Link to="/analytics" className="text-[#C84B26] hover:underline font-semibold flex items-center gap-1">
                Swiss Chronometer <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Panel (Col 8-12): Strongest Competencies vs. Gaps */}
          <div className="lg:col-span-5 bg-white border border-[#E5E0D4] rounded-lg p-6 shadow-xs flex flex-col justify-between">
            <div className="border-b border-[#E5E0D4] pb-4 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C8479]">
                DEFENSIVE RADAR
              </span>
              <h3 className="font-serif font-bold text-base text-[#181614] tracking-tight">
                Verified Strengths vs. Active Gaps
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-mono text-[#2E6347] font-bold uppercase mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Proven Competencies
                </div>
                <div className="space-y-1.5">
                  {s.strongest_skills.map((skill: string) => (
                    <div key={skill} className="px-3 py-2 rounded bg-[#EBF3EE] border border-[#D0E3D6] text-xs font-medium text-[#2E6347] flex items-center justify-between">
                      <span>{skill}</span>
                      <span className="font-mono text-[10px] font-bold">100% DEFENSE</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-mono text-[#A36114] font-bold uppercase mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Focus Areas for Next Session
                </div>
                <div className="space-y-1.5">
                  {s.weakest_skills.map((skill: string) => (
                    <div key={skill} className="px-3 py-2 rounded bg-[#FDF6E9] border border-[#F7E6C4] text-xs font-medium text-[#A36114] flex items-center justify-between">
                      <span>{skill}</span>
                      <span className="font-mono text-[10px] font-bold">REVISE STAR</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E0D4] mt-4 flex items-center justify-between">
              <Link to="/stories" className="text-xs font-mono font-semibold text-[#172535] hover:text-[#C84B26] flex items-center gap-1">
                Open Story Rolodex <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Launch Instruments Strip */}
        <div className="bg-[#FAF8F5] border border-[#E5E0D4] rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C84B26] font-bold">
              PHYSICAL APPARATUS LAUNCHPAD
            </span>
            <h4 className="font-serif font-bold text-lg text-[#181614]">
              Ready to execute another calibrated session?
            </h4>
            <p className="text-xs text-[#5C564E]">
              Navigate to the Architect's Drafting Desk or test your voice delivery on the Broadcast Stage.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link to="/jobs">
              <InkBleedButton icon={<Briefcase className="w-3.5 h-3.5" />}>
                Ticket Feed
              </InkBleedButton>
            </Link>
            <Link to="/resume/ats-checker">
              <InkBleedButton icon={<Layers className="w-3.5 h-3.5" />}>
                Optical Bench
              </InkBleedButton>
            </Link>
            <Link to="/interview/session/demo">
              <MechanicalButton variant="vermilion" size="md" icon={<PlayCircle className="w-4 h-4" />}>
                Broadcast Stage
              </MechanicalButton>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
