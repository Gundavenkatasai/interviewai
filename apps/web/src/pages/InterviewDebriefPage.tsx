import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  TrendingUp, TrendingDown, Target, Zap, Clock, ShieldAlert,
  CheckCircle2, ArrowRight, BrainCircuit, Activity
} from "lucide-react";
import { ApiClient } from "../lib/api";

export default function InterviewDebriefPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: debrief, isLoading: debriefLoading } = useQuery({
    queryKey: ["debrief", id],
    queryFn: () => ApiClient.getDebrief(id!),
    enabled: !!id,
    retry: false
  });

  const generateMutation = useMutation({
    mutationFn: () => ApiClient.generateDebrief(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debrief", id] });
    }
  });

  if (debriefLoading) {
    return <div className="flex h-screen items-center justify-center text-slate-400">Loading Debrief...</div>;
  }

  if (!debrief) {
    return (
      <div className="flex flex-col h-screen items-center justify-center text-slate-400 gap-6">
        <BrainCircuit className="w-16 h-16 text-slate-600" />
        <h2 className="text-2xl font-bold text-white">Debrief Not Generated</h2>
        <p>This interview session has not been analyzed yet.</p>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all"
        >
          {generateMutation.isPending ? "Generating Intelligence..." : "Generate Interview Debrief"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10">
      
      {/* Header */}
      <div className="mb-8 flex justify-between items-start border-b border-slate-800 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Target className="w-8 h-8 text-rose-400" />
            Interview Debrief
          </h1>
          <p className="text-slate-400 text-lg mt-2">
            AI analysis of your latest performance.
          </p>
        </div>
        
        <div className="flex gap-6 text-right">
          <div>
            <div className={`text-4xl font-black ${debrief.overallScore >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {debrief.overallScore}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mt-1">Overall Score</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: High Level Themes */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> What Went Well
            </h3>
            <ul className="space-y-3">
              {debrief.whatWentWell?.map((item: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-rose-950/20 border border-rose-900/50 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-rose-400 mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" /> What To Improve
            </h3>
            <ul className="space-y-3">
              {debrief.whatToImprove?.map((item: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300">
                  <ShieldAlert className="w-5 h-5 text-rose-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-indigo-950/20 border border-indigo-900/50 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-indigo-400 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" /> Next Practice Plan
            </h3>
            <div className="space-y-4">
              {debrief.nextPracticeItems?.map((item: any, i: number) => (
                <div key={i} className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-white">{item.action}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' :
                      item.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{item.why}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Question Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-400" /> Answer Breakdown
          </h2>
          
          <div className="space-y-4">
            {debrief.questionReviews?.map((qr: any, i: number) => (
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Question {i + 1} • {qr.category}</span>
                    <h4 className="text-lg font-bold text-white">Score: {qr.score}/10</h4>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 ${
                    qr.score >= 8 ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' :
                    qr.score >= 5 ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' :
                    'border-rose-500/50 text-rose-400 bg-rose-500/10'
                  }`}>
                    {qr.score}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-bold text-emerald-400 mb-2">Strengths</h5>
                    <ul className="list-disc pl-4 space-y-1">
                      {qr.strengths?.map((s: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-300">{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-rose-400 mb-2">Weaknesses / Missing</h5>
                    <ul className="list-disc pl-4 space-y-1">
                      {qr.weaknesses?.map((w: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-300">{w}</li>
                      ))}
                      {qr.missingElements?.map((m: string, idx: number) => (
                        <li key={`m-${idx}`} className="text-xs text-slate-400 italic">Missing: {m}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-indigo-950/30 border border-indigo-900/30 rounded-xl">
                  <div className="text-xs font-bold text-indigo-400 mb-1 uppercase">Suggested Improvement</div>
                  <p className="text-sm text-slate-300">{qr.suggestedImprovement}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
