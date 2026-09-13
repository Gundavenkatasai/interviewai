import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Brain, FileText, CheckCircle2, AlertTriangle, Crosshair, 
  Target, BarChart, ChevronDown, ChevronRight, Activity, ArrowRight, Lightbulb, Play, Clock
} from "lucide-react";
import { ApiClient } from "../lib/api";

export default function InterviewIntelligencePage() {
  const { id: jobId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Load Job
  const { data: job } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => ApiClient.getJob(jobId!),
    enabled: !!jobId,
  });

  // Load Resumes to pick default version
  const { data: resumes = [] } = useQuery({
    queryKey: ["resumes"],
    queryFn: () => ApiClient.getResumes(),
  });

  const [activeTab, setActiveTab] = useState<"priorities" | "technical" | "behavioral" | "questions" | "cheatsheet">("priorities");
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  useEffect(() => {
    if (resumes.length > 0 && !selectedResumeId) {
      // Pick canonical resume version id ideally, or the first resume's active version
      const activeVersion = resumes[0].activeVersionId || resumes[0].versions?.[0]?._id;
      if (activeVersion) setSelectedResumeId(activeVersion);
    }
  }, [resumes, selectedResumeId]);

  // Load Intelligence
  const { data: intel, isLoading: isIntelLoading, refetch } = useQuery({
    queryKey: ["intelligence", jobId],
    queryFn: () => ApiClient.getIntelligenceByJobId(jobId!),
    enabled: !!jobId,
    retry: false
  });

  const generateMutation = useMutation({
    mutationFn: (data: { jobId: string, resumeVersionId: string }) => ApiClient.generateIntelligence(data),
    onSuccess: () => {
      // Start polling
      const interval = setInterval(async () => {
        const { data } = await refetch();
        if (data && (data.status === "COMPLETED" || data.status === "FAILED")) {
          clearInterval(interval);
        }
      }, 3000);
    }
  });

  const handleGenerate = () => {
    if (jobId && selectedResumeId) {
      generateMutation.mutate({ jobId, resumeVersionId: selectedResumeId });
    }
  };

  const getReadinessColor = (state: string) => {
    switch (state) {
      case "STRONGLY_READY": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "READY": return "text-green-400 bg-green-500/10 border-green-500/20";
      case "PARTIALLY_READY": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "NEEDS_PREPARATION": return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "NOT_READY": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default: return "text-slate-400 bg-slate-800 border-slate-700";
    }
  };

  if (!job) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // 1. Empty State
  if (!intel && !isIntelLoading && !generateMutation.isPending) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <Brain className="w-16 h-16 text-indigo-500 mx-auto mb-6 opacity-80" />
          <h1 className="text-3xl font-bold text-white mb-4">Build Interview Intelligence</h1>
          <p className="text-slate-400 text-lg max-w-lg mx-auto mb-8">
            We will analyze your resume against {job.title || "this role"} at {job.company || "this company"} to build a personalized interview prep plan, predict likely questions, and identify weak spots.
          </p>
          <button
            onClick={handleGenerate}
            disabled={!selectedResumeId}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
          >
            Generate Intelligence
          </button>
        </div>
      </div>
    );
  }

  // 2. Loading State
  if (isIntelLoading || generateMutation.isPending || intel?.status === "GENERATING") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Activity className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-6" />
        <h2 className="text-xl font-bold text-white mb-2">Analyzing Candidate Evidence...</h2>
        <p className="text-slate-400">Mapping your resume to the job description and identifying likely interview signals.</p>
        <div className="mt-8 max-w-md mx-auto h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 w-2/3 animate-pulse"></div>
        </div>
      </div>
    );
  }

  // 3. Main Workspace
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10">
      
      <div className="mb-8">
        <Link to={`/jobs/${jobId}`} className="text-sm font-medium text-slate-400 hover:text-white flex items-center gap-1 mb-4">
          <ChevronRight className="w-4 h-4 rotate-180" /> Back to Job Details
        </Link>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Brain className="w-8 h-8 text-indigo-400" />
          Interview Intelligence
        </h1>
        <p className="text-slate-400 text-lg mt-2">
          {job.title} @ {job.company}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar - Readiness Score */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Readiness Score</h2>
            <div className="text-center mb-6">
              <div className="text-6xl font-black text-white tracking-tighter">{intel.readinessScore}</div>
              <div className="text-slate-500 font-medium">/ 100</div>
              <div className={`mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getReadinessColor(intel.readinessState)}`}>
                {intel.readinessState.replace(/_/g, " ")}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Technical Depth</span>
                <span className="text-white font-medium">{intel.readinessBreakdown?.technical || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Behavioral Stories</span>
                <span className="text-white font-medium">{intel.readinessBreakdown?.behavioral || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Resume Defense</span>
                <span className="text-white font-medium">{intel.readinessBreakdown?.resumeDefensibility || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Role Understanding</span>
                <span className="text-white font-medium">{intel.readinessBreakdown?.roleUnderstanding || 0}</span>
              </div>
            </div>
            
            <button 
              onClick={() => navigate(`/interview/practice?jobId=${jobId}`)}
              className="mt-8 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex justify-center items-center gap-2"
            >
              <Play className="w-4 h-4" /> Start Mock Interview
            </button>
          </div>
        </div>

        {/* Right Main Content */}
        <div className="lg:col-span-3">
          
          <div className="flex gap-2 border-b border-slate-800 mb-6 pb-px overflow-x-auto">
            {["priorities", "technical", "behavioral", "questions", "cheatsheet"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1).replace("Cheatsheet", "Cheat Sheet")}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            
            {activeTab === "priorities" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white mb-4">Top Preparation Priorities</h3>
                {intel.priorities?.map((p: any, i: number) => (
                  <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                            p.priorityLevel === "CRITICAL" ? "bg-red-500/10 text-red-400" :
                            p.priorityLevel === "HIGH" ? "bg-orange-500/10 text-orange-400" :
                            "bg-indigo-500/10 text-indigo-400"
                          }`}>
                            {p.priorityLevel}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {p.estimatedMinutes}m
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-white mb-1">{p.recommendedAction}</h4>
                        <p className="text-sm text-slate-400">{p.reason}</p>
                      </div>
                      <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors border border-slate-700">
                        Prepare
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "technical" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {intel.topics?.filter((t:any) => t.category === "TECHNICAL" || t.category === "SYSTEM_DESIGN").map((t:any, i:number) => (
                  <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-white font-bold">{t.topic}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        t.candidateStrength === "STRONG" ? "bg-emerald-500/10 text-emerald-400" :
                        t.candidateStrength === "WEAK" ? "bg-red-500/10 text-red-400" :
                        "bg-slate-800 text-slate-400"
                      }`}>{t.candidateStrength}</span>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                      <p><strong>Importance:</strong> {t.importance}</p>
                      <p><strong>Recommended Depth:</strong> {t.recommendedDepth}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "questions" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white mb-4">Likely Questions</h3>
                {intel.likelyQuestions?.map((q: any, i: number) => (
                  <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold">{q.category}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold">{q.difficulty}</span>
                    </div>
                    <h4 className="text-lg font-medium text-white mb-2">"{q.question}"</h4>
                    <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 text-sm text-slate-400">
                      <Lightbulb className="w-4 h-4 text-amber-400 inline mr-2" />
                      <strong>Why they will ask this:</strong> {q.whyLikely}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "cheatsheet" && (
              <div className="space-y-8">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8">
                  <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-4">Interview Cheat Sheet</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> Your Strengths
                      </h4>
                      <ul className="space-y-2">
                        {intel.cheatSheet?.strengths?.map((s: string, i: number) => (
                          <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                            <span className="text-emerald-500">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-orange-400 font-bold mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" /> Identified Gaps
                      </h4>
                      <ul className="space-y-2">
                        {intel.cheatSheet?.gaps?.map((g: string, i: number) => (
                          <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                            <span className="text-orange-500">•</span> {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h4 className="text-indigo-400 font-bold mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5" /> Defensible Resume Claims
                    </h4>
                    <ul className="space-y-3">
                      {intel.cheatSheet?.resumeClaims?.map((c: string, i: number) => (
                        <li key={i} className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-300 text-sm">
                          "{c}"
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8">
                    <h4 className="text-slate-300 font-bold mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5" /> Questions to Ask the Interviewer
                    </h4>
                    <ul className="space-y-3">
                      {intel.interviewerQuestions?.map((q: any, i: number) => (
                        <li key={i} className="text-slate-400 text-sm italic">
                          "{q.question}"
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "behavioral" && (
              <div className="p-8 text-center text-slate-400">
                <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Behavioral Preparation</h3>
                <p>The behavioral Story Bank will be unlocked in a future module (Day 14).</p>
                <p className="mt-2 text-sm">For now, refer to the Likely Questions tab for behavioral questions you may face.</p>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
