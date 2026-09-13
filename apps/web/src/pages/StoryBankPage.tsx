import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen, Plus, CheckCircle2, AlertCircle, PlayCircle, Star, Search, Filter, ShieldCheck, HelpCircle
} from "lucide-react";
import { ApiClient } from "../lib/api";

export default function StoryBankPage() {
  const queryClient = useQueryClient();
  const [extractText, setExtractText] = useState("");

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: () => ApiClient.getStories()
  });

  const extractMutation = useMutation({
    mutationFn: (text: string) => ApiClient.extractStory({ text }),
    onSuccess: () => {
      setExtractText("");
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    }
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => ApiClient.verifyStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    }
  });

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-slate-400">Loading Story Bank...</div>;
  }

  const verifiedCount = stories.filter((s: any) => s.status === "VERIFIED").length;
  const draftCount = stories.length - verifiedCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-400" />
            Story Bank
          </h1>
          <p className="text-slate-400 text-lg mt-2">
            Your verified, reusable evidence library for behavioral interviews.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{verifiedCount}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Verified Stories</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-300">{draftCount}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Drafts</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Add New & Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" /> Extract from Evidence
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Paste a bullet point from your resume or notes. We will extract a STAR story without inventing missing facts.
            </p>
            <textarea
              className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors mb-4"
              placeholder="e.g. Led the migration of our legacy API to a modern microservices architecture, reducing latency by 40% and zero downtime."
              value={extractText}
              onChange={(e) => setExtractText(e.target.value)}
            />
            <button
              onClick={() => extractMutation.mutate(extractText)}
              disabled={!extractText || extractMutation.isPending}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {extractMutation.isPending ? "Extracting..." : "Extract STAR Story"}
            </button>
          </div>
        </div>

        {/* Right Col: Story List */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Search stories by keyword, competency, or tag..." 
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button className="px-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-300 flex items-center gap-2 hover:bg-slate-800">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>

          {stories.length === 0 ? (
            <div className="text-center py-12 border border-slate-800 rounded-2xl bg-slate-900/30">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No stories yet</h3>
              <p className="text-slate-400">Extract your first story from your resume to begin building your bank.</p>
            </div>
          ) : (
            stories.map((story: any) => (
              <div key={story._id} className={`bg-slate-900/60 border rounded-2xl p-6 transition-all ${story.status === "VERIFIED" ? "border-emerald-500/30" : "border-slate-800"}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {story.status === "VERIFIED" ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> VERIFIED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> NEEDS REVIEW
                        </span>
                      )}
                      <span className="text-xs text-slate-500">Quality: {story.qualityScore}/100</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{story.title}</h3>
                  </div>
                  <div className="flex gap-2">
                    {!story.userVerified && (
                      <button 
                        onClick={() => verifyMutation.mutate(story._id)}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30 transition-colors"
                      >
                        Verify & Save
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="space-y-3">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                        SITUATION 
                        {story.situationCompleteness !== "COMPLETE" && <HelpCircle className="w-3 h-3 text-amber-500" />}
                      </div>
                      <p className="text-sm text-slate-300">{story.situation === "UNKNOWN" ? <span className="text-amber-500/70 italic">Needs input...</span> : story.situation}</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                        TASK
                        {story.taskCompleteness !== "COMPLETE" && <HelpCircle className="w-3 h-3 text-amber-500" />}
                      </div>
                      <p className="text-sm text-slate-300">{story.task === "UNKNOWN" ? <span className="text-amber-500/70 italic">Needs input...</span> : story.task}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                        ACTION
                        {story.actionCompleteness !== "COMPLETE" && <HelpCircle className="w-3 h-3 text-amber-500" />}
                      </div>
                      <p className="text-sm text-slate-300">{story.action === "UNKNOWN" ? <span className="text-amber-500/70 italic">Needs input...</span> : story.action}</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 relative">
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                        RESULT
                        {story.resultCompleteness !== "COMPLETE" && <HelpCircle className="w-3 h-3 text-amber-500" />}
                      </div>
                      <p className="text-sm text-slate-300">{story.result === "UNKNOWN" ? <span className="text-amber-500/70 italic">Needs input...</span> : story.result}</p>
                    </div>
                  </div>
                </div>

                {story.competencyIds?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {story.competencyIds.map((c: string) => (
                      <span key={c} className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-md border border-slate-700">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
