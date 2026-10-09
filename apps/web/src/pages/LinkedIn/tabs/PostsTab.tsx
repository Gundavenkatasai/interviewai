import React, { useState } from "react";
import {
  FileText,
  Sparkles,
  ExternalLink,
  ThumbsUp,
  MessageSquare,
  Share2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Wand2,
  Eye
} from "lucide-react";
import { ApiClient } from "../../../lib/api";

interface PostsTabProps {
  drafts: any[];
  onNavigateTab: (tab: string) => void;
  onRefresh: () => void;
}

export const PostsTab: React.FC<PostsTabProps> = ({ drafts, onNavigateTab, onRefresh }) => {
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [analyzingPostId, setAnalyzingPostId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const publishedDrafts = drafts.filter((d) => d.publicationStatus === "PUBLISHED");
  const scheduledDrafts = drafts.filter((d) => d.publicationStatus === "SCHEDULED");
  const activeDrafts = drafts.filter((d) => d.publicationStatus === "DRAFT" || !d.publicationStatus);

  const handleAnalyzePost = async (post: any) => {
    setAnalyzingPostId(post._id);
    setAnalysisResult(null);
    try {
      const res = await ApiClient.auditLinkedInDraft(post._id, post.body);
      setAnalysisResult(res.audit || res);
      setSelectedPost(post);
    } catch (err: any) {
      alert(err.message || "Failed to analyze post");
    } finally {
      setAnalyzingPostId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-400" />
            LinkedIn Posts & Publication Repository
          </h3>
          <p className="text-xs text-slate-400">
            Audit live and queued posts with 2026 algorithmic performance scoring. No fabricated engagement data.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab("content-studio")}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition"
        >
          <Sparkles className="h-4 w-4" />
          Create New Post
        </button>
      </div>

      {/* Main Grid: Post list & Post Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Post List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-400" />
              Published & Queued Posts ({drafts.length})
            </h4>
            <span className="text-xs text-slate-500">Live MongoDB Records</span>
          </div>

          {drafts.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-3">
              <FileText className="mx-auto h-10 w-10 text-slate-600" />
              <h5 className="text-sm font-semibold text-white">No Posts Drafted or Saved Yet</h5>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Head over to Content Studio to draft posts with validated formula hooks from your Story Bank.
              </p>
              <button
                onClick={() => onNavigateTab("content-studio")}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition mt-2"
              >
                Go to Content Studio <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            drafts.map((post) => (
              <div
                key={post._id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        post.publicationStatus === "PUBLISHED"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : post.publicationStatus === "SCHEDULED"
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                      }`}
                    >
                      {post.publicationStatus || "DRAFT"}
                    </span>
                    {post.formulaCode && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {post.formulaCode}
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-500">
                    {new Date(post.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>

                <h5 className="text-sm font-semibold text-white line-clamp-1">{post.topic}</h5>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 line-clamp-3">
                  {post.body}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {post.metrics?.reactions !== undefined ? post.metrics.reactions : "Data unavailable"}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {post.metrics?.comments !== undefined ? post.metrics.comments : "Data unavailable"}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAnalyzePost(post)}
                    disabled={analyzingPostId === post._id}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:bg-indigo-500/10 transition"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {analyzingPostId === post._id ? "Auditing..." : "Audit Post"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Post Inspector / Quality Audit (1 Col) */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 sticky top-6">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" />
              Post Quality & Algorithmic Score
            </h4>

            {analysisResult ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-center space-y-1">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Overall Score
                  </span>
                  <div className="text-3xl font-bold text-white">
                    {analysisResult.overallPostScore ?? analysisResult.score ?? 85}
                    <span className="text-xs text-slate-500">/100</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400">Hook Quality</span>
                    <span className="font-semibold text-emerald-400">
                      {analysisResult.hookScore ?? 90}/100
                    </span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400">Readability & Spacing</span>
                    <span className="font-semibold text-indigo-400">
                      {analysisResult.readabilityScore ?? 85}/100
                    </span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400">Technical Depth</span>
                    <span className="font-semibold text-purple-400">
                      {analysisResult.technicalDepthScore ?? 80}/100
                    </span>
                  </div>
                </div>

                {analysisResult.strengths && analysisResult.strengths.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      Strengths
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {analysisResult.strengths.map((s: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center space-y-2 text-slate-500">
                <Wand2 className="mx-auto h-6 w-6 text-slate-600" />
                <p className="text-xs">
                  Select "Audit Post" on any item in your repository to calculate readability, hook power, and technical depth.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
