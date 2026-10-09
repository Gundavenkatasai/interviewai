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
  ExternalLink,
  MessageCircle
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

  // Real Stored Drafts (zero demo-c1/demo-r1 mock items)
  const [commentDrafts, setCommentDrafts] = useState<any[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<any[]>([]);

  const handleDraftComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postUrl.trim()) return;
    setGenerating(true);
    try {
      const res = await ApiClient.draftLinkedInComment({
        postUrl: postUrl.trim(),
        contextNotes: contextNotes.trim(),
        angle,
      });
      if (res?.draft) {
        setCommentDrafts([res.draft, ...commentDrafts]);
      }
      setPostUrl("");
      setContextNotes("");
    } catch (err: any) {
      alert(err.message || "Failed to draft value-add comment");
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
      if (res?.draft) {
        setReplyDrafts([res.draft, ...replyDrafts]);
      }
      setReplyToText("");
      setReplyPostUrl("");
    } catch (err: any) {
      alert(err.message || "Failed to draft reply");
    } finally {
      setGeneratingReply(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-400" />
            Value-Add Engagement Assistant
          </h3>
          <p className="text-xs text-slate-400">
            High-leverage comment and reply generation. Strictly avoids generic corporate platitudes ("Great post!").
          </p>
        </div>

        <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab("comments")}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeSubTab === "comments" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Comment Drafter
          </button>
          <button
            onClick={() => setActiveSubTab("replies")}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeSubTab === "replies" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Reply Assistant
          </button>
        </div>
      </div>

      {/* 1. COMMENT DRAFTER */}
      {activeSubTab === "comments" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Creator Form */}
          <form
            onSubmit={handleDraftComment}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4"
          >
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Generate Insightful Comment
            </h4>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Post URL</label>
              <input
                type="text"
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                placeholder="https://www.linkedin.com/posts/..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Context / Technical Nuance (Optional)
              </label>
              <textarea
                rows={3}
                value={contextNotes}
                onChange={(e) => setContextNotes(e.target.value)}
                placeholder="Specific technology, tradeoff, or personal production experience to incorporate..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:outline-none resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Comment Perspective / Angle</label>
              <select
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="insight">Technical Insight & Engineering Tradeoff</option>
                <option value="experience">Production Anecdote / Real-World Evidence</option>
                <option value="question">Thoughtful Technical Inquiry</option>
                <option value="counterpoint">Respectful Contrarian Counterpoint</option>
                <option value="supporting">Supporting Data Point</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Generate Value-Add Comment
            </button>
          </form>

          {/* Comment Drafts Stream */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-indigo-400" />
              Generated Comment Drafts ({commentDrafts.length})
            </h4>

            {commentDrafts.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-10 text-center space-y-2 text-slate-500 text-xs">
                <MessageSquare className="mx-auto h-8 w-8 text-slate-600" />
                <p>No comments drafted in current session.</p>
                <p className="text-[11px] text-slate-600">
                  Input target post URL on the left to create thoughtful, value-add contributions.
                </p>
              </div>
            ) : (
              commentDrafts.map((draft, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-indigo-400 text-[10px] uppercase font-bold bg-indigo-500/10 px-2 py-0.5 rounded">
                      {draft.angle || angle}
                    </span>
                    <button
                      onClick={() => handleCopy(draft._id || String(idx), draft.commentText)}
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-white"
                    >
                      {copiedId === (draft._id || String(idx)) ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    {draft.commentText}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. REPLY ASSISTANT */}
      {activeSubTab === "replies" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleDraftReply}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4"
          >
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <CornerDownRight className="h-4 w-4 text-indigo-400" />
              Reply to Comment
            </h4>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Comment Being Answered</label>
              <textarea
                rows={3}
                value={replyToText}
                onChange={(e) => setReplyToText(e.target.value)}
                placeholder="Paste the comment someone left on your post..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:outline-none resize-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Reply Tone</label>
              <select
                value={replyAngle}
                onChange={(e) => setReplyAngle(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="helpful">Helpful & Technically Rigorous</option>
                <option value="clarifying">Clarifying Context / Nuance</option>
                <option value="collaborative">Inviting Further Dialogue</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={generatingReply}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {generatingReply ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CornerDownRight className="h-4 w-4" />}
              Draft Reply
            </button>
          </form>

          {/* Reply Drafts Stream */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-400" />
              Generated Reply Drafts ({replyDrafts.length})
            </h4>

            {replyDrafts.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-10 text-center space-y-2 text-slate-500 text-xs">
                <CornerDownRight className="mx-auto h-8 w-8 text-slate-600" />
                <p>No replies drafted yet.</p>
              </div>
            ) : (
              replyDrafts.map((reply, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-indigo-400 text-[10px] uppercase font-bold bg-indigo-500/10 px-2 py-0.5 rounded">
                      {reply.angle || replyAngle}
                    </span>
                    <button
                      onClick={() => handleCopy(reply._id || String(idx), reply.replyText)}
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-white"
                    >
                      {copiedId === (reply._id || String(idx)) ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    {reply.replyText}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
