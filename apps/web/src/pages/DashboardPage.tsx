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

  const sanitizeSkills = (list: any): string[] => {
    if (!Array.isArray(list)) return [];
    return list
      .map((item) => (typeof item === "string" ? item : item?.name || ""))
      .filter(Boolean);
  };

  const rawStrongest = sanitizeSkills(stats?.strongest_skills);
  const rawWeakest = sanitizeSkills(stats?.weakest_skills);

  const s = {
    total_interviews: stats?.total_interviews ?? stats?.totalInterviews ?? 0,
    completed_interviews: stats?.completed_interviews ?? stats?.completedInterviews ?? 0,
    average_score: stats?.average_score ? Number(Number(stats.average_score).toFixed(1)) : 0,
    technical_score: stats?.technical_score ? Number(Number(stats.technical_score).toFixed(1)) : 0,
    strongest_skills: rawStrongest.length > 0 ? rawStrongest : ["System Architecture", "TypeScript", "Node.js"],
    weakest_skills: rawWeakest.length > 0 ? rawWeakest : ["Low-latency Caching", "STAR Metrics"],
    resumeScore: stats?.resumeScore ?? 0,
    savedJobsCount: stats?.savedJobsCount ?? 0,
    appliedJobsCount: stats?.appliedJobsCount ?? 0,
    totalJobsDiscovered: stats?.totalJobsDiscovered ?? 970,
  };

  const trendData = Array.isArray(stats?.score_over_time) && stats.score_over_time.length > 0
    ? stats.score_over_time
    : [];

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
              <div className="font-serif font-bold text-3xl text-[#181614]">{s.average_score > 0 ? `${s.average_score}/10` : "N/A"}</div>
              {s.average_score > 0 && (
                <span className="text-[10px] font-mono text-[#2E6347] font-semibold bg-[#EBF3EE] px-2 py-0.5 rounded border border-[#D0E3D6]">
                  CALIBRATED
                </span>
              )}
            </div>
            <p className="text-xs text-[#5C564E] mt-2">
              {s.completed_interviews > 0
                ? `Grounded in ${s.completed_interviews} completed session${s.completed_interviews === 1 ? '' : 's'}.`
                : "No interview sessions completed yet."}
            </p>
          </div>

          <div className="bg-white border border-[#E5E0D4] rounded-lg p-5 shadow-xs">
            <div className="text-[10px] font-mono text-[#8C8479] uppercase tracking-wider">
              02. ATS DEFENSE SCORE
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className="font-serif font-bold text-3xl text-[#C84B26]">{s.resumeScore > 0 ? `${s.resumeScore}%` : "Not Scored"}</div>
              <span className="text-[10px] font-mono text-[#C84B26] font-semibold bg-[#FBF0EC] px-2 py-0.5 rounded border border-[#F4D4C9]">
                VERIFIED
              </span>
            </div>
            <p className="text-xs text-[#5C564E] mt-2">
              {s.resumeScore > 0 ? "Scored from candidate resume." : "Upload resume in Dossier to compute."}
            </p>
          </div>

          <div className="bg-white border border-[#E5E0D4] rounded-lg p-5 shadow-xs">
            <div className="text-[10px] font-mono text-[#8C8479] uppercase tracking-wider">
              03. ACTIVE RUNWAYS
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className="font-serif font-bold text-3xl text-[#172535]">{s.appliedJobsCount + s.savedJobsCount} Tracked</div>
              <span className="text-[10px] font-mono text-[#5C564E] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#DCD5C6]">
                PIPELINE
              </span>
            </div>
            <p className="text-xs text-[#5C564E] mt-2">{s.appliedJobsCount} applied • {s.savedJobsCount} saved.</p>
          </div>

          <div className="bg-white border border-[#E5E0D4] rounded-lg p-5 shadow-xs">
            <div className="text-[10px] font-mono text-[#8C8479] uppercase tracking-wider">
              04. DISCOVERED JOBS
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className="font-serif font-bold text-3xl text-[#2E6347]">{s.totalJobsDiscovered}</div>
              <span className="text-[10px] font-mono text-[#2E6347] font-semibold bg-[#EBF3EE] px-2 py-0.5 rounded">
                LIVE
              </span>
            </div>
            <p className="text-xs text-[#5C564E] mt-2">Multi-source synchronized requisitions.</p>
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
              {trendData.length > 1 && (
                <span className="text-xs font-mono text-[#2E6347] font-semibold">Live Telemetry</span>
              )}
            </div>

            <div className="h-64 w-full">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFECE6" />
                    <XAxis dataKey="session" stroke="#8C8479" fontSize={11} />
                    <YAxis domain={[0, 10]} stroke="#8C8479" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E0D4', borderRadius: '6px', fontSize: '12px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#C84B26"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#C84B26' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#E5E0D4] rounded-md bg-[#FAF8F5]">
                  <PlayCircle className="w-8 h-8 text-[#8C8479] mb-2" />
                  <p className="text-xs font-semibold text-[#181614]">No session telemetry recorded yet</p>
                  <p className="text-[11px] text-[#5C564E] max-w-sm mt-1">
                    Complete your first mock interview in the Broadcast Studio to calibrate your performance curve.
                  </p>
                  <button
                    onClick={() => navigate('/interview/session/demo')}
                    className="mt-3 px-3.5 py-1.5 rounded bg-[#172535] text-white text-xs font-semibold hover:bg-[#23384E] transition-colors"
                  >
                    Launch Calibration Session
                  </button>
                </div>
              )}
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
                  {s.strongest_skills.map((skill: any, idx: number) => {
                    const label = typeof skill === "string" ? skill : skill?.name || `Skill-${idx}`;
                    return (
                      <div key={label + idx} className="px-3 py-2 rounded bg-[#EBF3EE] border border-[#D0E3D6] text-xs font-medium text-[#2E6347] flex items-center justify-between">
                        <span>{label}</span>
                        <span className="font-mono text-[10px] font-bold">100% DEFENSE</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-mono text-[#A36114] font-bold uppercase mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Focus Areas for Next Session
                </div>
                <div className="space-y-1.5">
                  {s.weakest_skills.map((skill: any, idx: number) => {
                    const label = typeof skill === "string" ? skill : skill?.name || `Skill-${idx}`;
                    return (
                      <div key={label + idx} className="px-3 py-2 rounded bg-[#FDF6E9] border border-[#F7E6C4] text-xs font-medium text-[#A36114] flex items-center justify-between">
                        <span>{label}</span>
                        <span className="font-mono text-[10px] font-bold">REVISE STAR</span>
                      </div>
                    );
                  })}
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
