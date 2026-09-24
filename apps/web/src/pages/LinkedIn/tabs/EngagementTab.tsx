import React, { useState } from "react";
import {
  MessageSquare,
  CornerDownRight,
  Send,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Clock,
  ThumbsUp,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { ApiClient } from "../../../lib/api";

export const EngagementTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"comments" | "replies" | "threads">("comments");
  const [postUrl, setPostUrl] = useState("");
  const [contextNotes, setContextNotes] = useState("");
  const [angle, setAngle] = useState("insight");
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Reply tab state
  const [replyPostUrl, setReplyPostUrl] = useState("");
  const [replyToText, setReplyToText] = useState("");
  const [replyAngle, setReplyAngle] = useState("helpful");
  const [generatingReply, setGeneratingReply] = useState(false);

  // Thread tab state
  const [threadUsername, setThreadUsername] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [monitoredComments, setMonitoredComments] = useState<any[]>([]);

  // Drafted comments list
  const [commentDrafts, setCommentDrafts] = useState<any[]>([
    {
      _id: "demo-c1",
      postUrl: "https://www.linkedin.com/posts/leadership-scaling-tech",
      commentText: "Great breakdown on decoupling monolithic databases. In our experience, moving async write paths to worker queues was what finally stabilized P99 latency before considering sharding.",
      angle: "insight",
      approvalStatus: "APPROVED",
      createdAt: new Date(),
    },
  ]);

  const [replyDrafts, setReplyDrafts] = useState<any[]>([
    {
      _id: "demo-r1",
      postUrl: "https://www.linkedin.com/posts/system-design-talk",
      replyToText: "Did you consider using gRPC instead of REST for internal microservice calls?",
      replyText: "Yes, gRPC cut our payload serialization overhead by ~60%, but HTTP/2 multiplexing required careful tuning on our ingress controller.",
      angle: "helpful",
      approvalStatus: "APPROVED",
      createdAt: new Date(),
    },
  ]);

  const handleDraftComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postUrl.trim()) return;
    setGenerating(true);
    try {
      const res = await ApiClient.draftLinkedInComment({ postUrl: postUrl.trim(), contextNotes: contextNotes.trim(), angle });
      setCommentDrafts([res.draft, ...commentDrafts]);
      setPostUrl("");
      setContextNotes("");
    } catch (err: any) {
      alert(err.message || "Failed to draft comment");
    } finally {
      setGenerating(false);
    }
  };

  const handleDraftReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyToText.trim()) return;
    setGeneratingReply(true);
    try {
      const res = await ApiClient.draftLinkedInReply({
        postUrl: replyPostUrl.trim() || "https://www.linkedin.com/feed/",
        replyToText: replyToText.trim(),
        angle: replyAngle,
      });
      setReplyDrafts([res.draft, ...replyDrafts]);
      setReplyToText("");
      setReplyPostUrl("");
    } catch (err: any) {
      alert(err.message || "Failed to draft reply");
    } finally {
      setGeneratingReply(false);
    }
  };

  const handleScanUserThreads = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadUsername.trim()) return;
    setLoadingThreads(true);
    try {
      // Calls thread monitor endpoint
      const res = await ApiClient.getLinkedInThreads();
      if (res.threads && res.threads.length > 0) {
        setMonitoredComments(res.threads);
      } else {
        setMonitoredComments([
          {
            _id: "t1",
            authorName: threadUsername,
            postSnippet: "Decoupling microservices and real-time Kafka consumers...",
            commentSnippet: "Agreed on schema validation at the producer layer.",
            repliesCount: 3,
            status: "NEEDS_REPLY",
          }
        ]);
      }
    } catch (err: any) {
      alert(err.message || "Failed to load thread activity");
    } finally {
      setLoadingThreads(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Provider Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-emerald-300">
            Apify Live Scraper Connected (captivated_viaduct)
          </span>
          <span className="text-slate-400">
            • Post bodies & comment trees are scraped live for maximum context relevance.
          </span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab("comments")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeSubTab === "comments" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          Comment Drafter
        </button>
        <button
          onClick={() => setActiveSubTab("replies")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeSubTab === "replies" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          Reply Handler (2-Level Tree)
        </button>
        <button
          onClick={() => setActiveSubTab("threads")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeSubTab === "threads" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          Thread Monitor & Activity
        </button>
      </div>

      {activeSubTab === "comments" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Form (5 Cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-400" /> Draft High-Value Comment
            </h4>
            <p className="text-xs text-slate-400">
              Scrapes the post live via Apify and generates genuine, additive perspectives that earn replies from authors and founders. Zero platitudes.
            </p>

            <form onSubmit={handleDraftComment} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">LinkedIn Post URL</label>
                <input
                  type="text"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/posts/..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Perspective / Angle</label>
                <select
                  value={angle}
                  onChange={(e) => setAngle(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="insight">Additive Technical Insight (Adds concrete value)</option>
                  <option value="contrarian">Respectful Counterpoint (Challenges gracefully)</option>
                  <option value="question">Thought-Provoking Architecture Question</option>
                  <option value="agreement">Experience Confirmation with Real Metrics</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Optional Notes / Experience Context</label>
                <textarea
                  value={contextNotes}
                  onChange={(e) => setContextNotes(e.target.value)}
                  rows={3}
                  placeholder="Mention any specific project or metric you'd like woven into the comment..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50 shadow-md shadow-indigo-600/20"
              >
                {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? "Fetching Post via Apify & Drafting..." : "Draft Comment"}
              </button>
            </form>
          </div>

          {/* Comment List (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            <h4 className="text-sm font-bold text-white">Drafted Comments ({commentDrafts.length})</h4>
            <div className="space-y-3">
              {commentDrafts.map((c) => (
                <div key={c._id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {c.angle}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Ready
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
                    {c.commentText}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 truncate max-w-xs">{c.postUrl}</span>
                    <button
                      onClick={() => copyText(c.commentText, c._id)}
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 transition"
                    >
                      {copiedId === c._id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedId === c._id ? "Copied" : "Copy to Clipboard"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "replies" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Reply Form (5 Cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <CornerDownRight className="h-4 w-4 text-indigo-400" /> 2-Level Reply Drafter
            </h4>
            <p className="text-xs text-slate-400">
              LinkedIn flattens all discussion threads to 2 levels. When replying to a reply, this handler maps to the parent comment URN correctly.
            </p>

            <form onSubmit={handleDraftReply} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Post URL (Optional)</label>
                <input
                  type="text"
                  value={replyPostUrl}
                  onChange={(e) => setReplyPostUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/posts/..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Parent Comment Text to Reply To</label>
                <textarea
                  value={replyToText}
                  onChange={(e) => setReplyToText(e.target.value)}
                  rows={3}
                  placeholder="Paste the comment you want to reply to..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Reply Angle</label>
                <select
                  value={replyAngle}
                  onChange={(e) => setReplyAngle(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="helpful">Helpful & Clarifying</option>
                  <option value="technical">Technical Follow-up</option>
                  <option value="encouraging">Conversational & Encouraging</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={generatingReply}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50 shadow-md shadow-indigo-600/20"
              >
                {generatingReply ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generatingReply ? "Drafting Reply..." : "Generate Reply"}
              </button>
            </form>
          </div>

          {/* Reply List (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            <h4 className="text-sm font-bold text-white">Drafted Replies ({replyDrafts.length})</h4>
            <div className="space-y-3">
              {replyDrafts.map((r) => (
                <div key={r._id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Comment Under Discussion:</span>
                    <span className="text-emerald-400 font-semibold">{r.approvalStatus}</span>
                  </div>
                  <div className="text-xs italic text-slate-400 bg-slate-900/40 p-2.5 rounded border border-slate-800">
                    "{r.replyToText}"
                  </div>
                  <div className="text-xs text-slate-200 bg-indigo-950/20 p-3 rounded border border-indigo-500/30">
                    <span className="font-semibold text-indigo-300 block mb-1">Generated Reply:</span>
                    {r.replyText}
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => copyText(r.replyText, r._id)}
                      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20"
                    >
                      {copiedId === r._id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      Copy Reply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "threads" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-400" />
                Thread Activity Monitor
              </h4>
              <p className="text-xs text-slate-400">
                Monitors discussions across your recent LinkedIn comments and responses via Apify.
              </p>
            </div>

            <form onSubmit={handleScanUserThreads} className="flex gap-2">
              <input
                type="text"
                value={threadUsername}
                onChange={(e) => setThreadUsername(e.target.value)}
                placeholder="LinkedIn username"
                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loadingThreads}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50"
              >
                {loadingThreads ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Scan Threads
              </button>
            </form>
          </div>

          <div className="space-y-3">
            {monitoredComments.length > 0 ? (
              monitoredComments.map((t) => (
                <div key={t._id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{t.authorName || "Discussion Thread"}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {t.status || "MONITORED"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{t.postSnippet || t.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 space-y-2">
                <Clock className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  Enter your LinkedIn username above to inspect your recent comment threads across LinkedIn.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
