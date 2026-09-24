import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  Wand2,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Eye,
  FileText,
  Sliders,
  Award,
  Layers,
  Repeat
} from "lucide-react";
import { ApiClient } from "../../../lib/api";

interface ContentStudioTabProps {
  drafts: any[];
  onDraftCreated: () => void;
}

export const ContentStudioTab: React.FC<ContentStudioTabProps> = ({ drafts, onDraftCreated }) => {
  const [topic, setTopic] = useState("Scaling Node.js microservices to 10k RPS");
  const [targetAudience, setTargetAudience] = useState("engineers");
  const [goal, setGoal] = useState("comments");
  const [formulaCode, setFormulaCode] = useState("F7");
  const [desiredLength, setDesiredLength] = useState("medium");
  const [activeSubMode, setActiveSubMode] = useState<"write" | "repurpose" | "hook_extract">("write");

  // Repurposer state
  const [repurposeType, setRepurposeType] = useState<any>("resume_story");
  const [repurposeContent, setRepurposeContent] = useState("");

  // Hook Extractor state
  const [hookInputUrl, setHookInputUrl] = useState("");
  const [hookInputText, setHookInputText] = useState("");
  const [extractedHook, setExtractedHook] = useState<any>(null);

  // Active Draft State
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [draftBody, setDraftBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const [humanizing, setHumanizing] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Quality / Feedback states
  const [humanizerNotes, setHumanizerNotes] = useState<string>("");
  const [auditResult, setAuditResult] = useState<any>(null);
  const [approvalStatus, setApprovalStatus] = useState<string>("DRAFT");
  const [publishModal, setPublishModal] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const formulas = [
    { code: "F7", name: "Odd-Precision Money/Cost Ledger", multiplier: "9.4x", note: "Strongest 2026 opener (+34% likes)" },
    { code: "F1", name: "Platform Risk Anaphora", multiplier: "4,240", note: "Category & platform pivot takes" },
    { code: "F2", name: "R.I.P. Obituary", multiplier: "3,822", note: "Era-ending claims & industry shifts" },
    { code: "F3", name: "Year-over-Year Pivot", multiplier: "3.74x", note: "Founder reflection & growth" },
    { code: "F4", name: "Time-Anchor Confession", multiplier: "1,519+", note: "Dated uncomfortable career fact" },
    { code: "F10", name: "Contrarian + Historical Receipts", multiplier: "3,083", note: "Sacred-cow takes in tech" },
    { code: "F17", name: "Controlled A/B Anecdote", multiplier: "High", note: "One-variable engineering comparison" },
    { code: "F18", name: "False-Binary Dissolve", multiplier: "High", note: "Both obvious answers fail" },
  ];

  const handleGeneratePost = async () => {
    setGenerating(true);
    try {
      const res = await ApiClient.createLinkedInDraft({
        topic,
        targetAudience,
        goal,
        formulaCode,
        desiredLength,
      });
      const d = res.draft;
      setCurrentDraftId(d._id);
      setDraftBody(d.body);
      setApprovalStatus(d.approvalStatus || "DRAFT");
      setHumanizerNotes("");
      setAuditResult(null);
      onDraftCreated();
    } catch (err: any) {
      alert(err.message || "Failed to generate post");
    } finally {
      setGenerating(false);
    }
  };

  const handleHumanize = async () => {
    if (!draftBody.trim()) return;
    setHumanizing(true);
    try {
      const res = await ApiClient.humanizeLinkedInDraft(currentDraftId || undefined, draftBody);
      setDraftBody(res.humanizedText);
      setHumanizerNotes(res.notes);
      setApprovalStatus("USER_EDITED");
    } catch (err: any) {
      alert(err.message || "Humanizer failed");
    } finally {
      setHumanizing(false);
    }
  };

  const handleAudit = async () => {
    if (!draftBody.trim()) return;
    setAuditing(true);
    try {
      const res = await ApiClient.auditLinkedInDraft(currentDraftId || undefined, draftBody);
      setAuditResult(res);
    } catch (err: any) {
      alert(err.message || "Audit failed");
    } finally {
      setAuditing(false);
    }
  };

  const handleApprove = async () => {
    if (!currentDraftId) {
      // Save draft first
      const res = await ApiClient.createLinkedInDraft({ topic, desiredLength, body: draftBody } as any);
      setCurrentDraftId(res.draft._id);
      await ApiClient.approveLinkedInDraft(res.draft._id);
    } else {
      await ApiClient.updateLinkedInDraft(currentDraftId, { body: draftBody });
      await ApiClient.approveLinkedInDraft(currentDraftId);
    }
    setApprovalStatus("APPROVED");
    onDraftCreated();
  };

  const handlePublish = async () => {
    if (!currentDraftId) return;
    setPublishing(true);
    try {
      const res = await ApiClient.publishLinkedInDraft(currentDraftId);
      setPublishModal(res);
      setApprovalStatus("COMPLETED");
      onDraftCreated();
    } catch (err: any) {
      alert(err.message || "Publishing failed");
    } finally {
      setPublishing(false);
    }
  };

  const handleRepurpose = async () => {
    if (!repurposeContent.trim()) return;
    setGenerating(true);
    try {
      const res = await ApiClient.repurposeLinkedInContent({
        sourceType: repurposeType,
        sourceContent: repurposeContent,
        goal,
      });
      const d = res.draft;
      setCurrentDraftId(d._id);
      setDraftBody(d.body);
      setApprovalStatus("DRAFT");
      setActiveSubMode("write");
      onDraftCreated();
    } catch (err: any) {
      alert(err.message || "Repurpose failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleExtractHook = async () => {
    try {
      const res = await ApiClient.extractLinkedInHook({
        url: hookInputUrl || undefined,
        postText: hookInputText || undefined,
      });
      setExtractedHook(res.data);
    } catch (err: any) {
      alert(err.message || "Failed to extract hook");
    }
  };

  const charCount = draftBody.length;
  const isQuestionOpener = draftBody.split("\n")[0]?.trim().endsWith("?");

  return (
    <div className="space-y-6">
      {/* Sub-mode selector */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubMode("write")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubMode === "write"
                ? "bg-indigo-600 text-white"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Draft from Scratch
          </button>
          <button
            onClick={() => setActiveSubMode("repurpose")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubMode === "repurpose"
                ? "bg-indigo-600 text-white"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Repurposer (Resume / Blog / Transcript)
          </button>
          <button
            onClick={() => setActiveSubMode("hook_extract")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubMode === "hook_extract"
                ? "bg-indigo-600 text-white"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Hook Extractor
          </button>
        </div>

        {/* Existing Drafts Dropdown */}
        {drafts.length > 0 && (
          <select
            onChange={(e) => {
              const d = drafts.find((x) => x._id === e.target.value);
              if (d) {
                setCurrentDraftId(d._id);
                setDraftBody(d.body);
                setTopic(d.topic);
                setApprovalStatus(d.approvalStatus);
              }
            }}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">Load Existing Draft...</option>
            {drafts.map((d) => (
              <option key={d._id} value={d._id}>
                {d.topic.slice(0, 35)} ({d.approvalStatus})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 3-Column Content Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Inputs & Formula (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {activeSubMode === "write" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-indigo-400" /> Post Parameters
              </h4>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Core Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Goal</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="comments">Comments (Discussion)</option>
                    <option value="reposts">Reposts (Reach)</option>
                    <option value="likes">Likes (Warmth)</option>
                    <option value="saves">Saves (Reference)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Target Length</label>
                  <select
                    value={desiredLength}
                    onChange={(e) => setDesiredLength(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="short">Short (300-500)</option>
                    <option value="medium">Medium (900-1300)</option>
                    <option value="long">Long (1500-1900)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-xs font-medium text-slate-400 flex items-center justify-between">
                  <span>2026 Hook Formula</span>
                  <span className="text-[10px] text-indigo-400">F1–F20 Library</span>
                </label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {formulas.map((f) => (
                    <button
                      key={f.code}
                      onClick={() => setFormulaCode(f.code)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition border ${
                        formulaCode === f.code
                          ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-200"
                          : "bg-slate-950/40 border-slate-800/60 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>{f.code}: {f.name}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">{f.multiplier}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{f.note}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGeneratePost}
                disabled={generating}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition disabled:opacity-50"
              >
                {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {generating ? "Generating Draft..." : "Generate Post"}
              </button>
            </div>
          )}

          {activeSubMode === "repurpose" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Repeat className="h-4 w-4 text-purple-400" /> Content Repurposer
              </h4>
              <p className="text-xs text-slate-400">
                Transforms projects, resume achievements, or transcripts into LinkedIn format while preserving verified facts intact.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Source Type</label>
                <select
                  value={repurposeType}
                  onChange={(e) => setRepurposeType(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="resume_story">Resume Experience / Achievement</option>
                  <option value="project">Project Case Study</option>
                  <option value="blog">Technical Blog Post</option>
                  <option value="transcript">YouTube / Podcast Transcript</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Source Content</label>
                <textarea
                  value={repurposeContent}
                  onChange={(e) => setRepurposeContent(e.target.value)}
                  rows={6}
                  placeholder="Paste your resume story, blog snippet, or transcript here..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleRepurpose}
                disabled={generating || !repurposeContent.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-500 transition disabled:opacity-50"
              >
                {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Repurpose to Post
              </button>
            </div>
          )}

          {activeSubMode === "hook_extract" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" /> Hook Extractor
              </h4>
              <p className="text-xs text-slate-400">
                Analyze high-performing LinkedIn posts to extract reusable formula patterns.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Post URL</label>
                <input
                  type="text"
                  value={hookInputUrl}
                  onChange={(e) => setHookInputUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/posts/..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Or Paste Post Text</label>
                <textarea
                  value={hookInputText}
                  onChange={(e) => setHookInputText(e.target.value)}
                  rows={3}
                  placeholder="Paste the first 3 lines or full post text..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <button
                onClick={handleExtractHook}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 transition"
              >
                Extract Hook Formula
              </button>

              {extractedHook && (
                <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-cyan-300">
                    <span>{extractedHook.hookType}</span>
                    <span>{extractedHook.confidence}% Match</span>
                  </div>
                  <p className="text-slate-300">{extractedHook.explanation}</p>
                  <div className="p-2 rounded bg-slate-950 text-slate-400 font-mono text-[11px]">
                    {extractedHook.reusableTemplate}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CENTER COLUMN: Live Markdown Draft (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">Live Post Draft</h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    approvalStatus === "APPROVED"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {approvalStatus}
                </span>
              </div>

              <span className={`text-xs font-mono ${charCount > 3000 ? "text-red-400 font-bold" : "text-slate-400"}`}>
                {charCount} / 3,000 chars
              </span>
            </div>

            <textarea
              value={draftBody}
              onChange={(e) => {
                setDraftBody(e.target.value);
                setApprovalStatus("USER_EDITED");
              }}
              placeholder="Your drafted LinkedIn post will appear here. You can also type or edit directly..."
              rows={16}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-200 font-sans leading-relaxed focus:border-indigo-500 focus:outline-none"
            />

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800">
              <div className="flex gap-2">
                <button
                  onClick={handleHumanize}
                  disabled={humanizing || !draftBody.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition disabled:opacity-50"
                >
                  {humanizing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                  Humanize Pass
                </button>

                <button
                  onClick={handleAudit}
                  disabled={auditing || !draftBody.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition disabled:opacity-50"
                >
                  {auditing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  Audit (2026 Feed)
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleApprove}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve Draft
                </button>

                <button
                  onClick={handlePublish}
                  disabled={approvalStatus !== "APPROVED" || publishing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-40"
                >
                  {publishing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Publish
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Quality Panel & Diagnostics (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-indigo-400" /> Quality & Reach Panel
            </h4>

            {/* 2026 Feed Warnings */}
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                {isQuestionOpener ? (
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-200">Opening Hook Type</span>
                  <p className="text-[11px] text-slate-400">
                    {isQuestionOpener
                      ? "Warning: Opening with a question penalizes reach by -34% in 2026. Invert into a statement."
                      : "Good: Statement or number-first opener complies with 2026 algorithms."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-200">Provenance Safety</span>
                  <p className="text-[11px] text-slate-400">
                    All metrics and career assertions derive from your Candidate Profile or Story Bank.
                  </p>
                </div>
              </div>
            </div>

            {/* Humanizer notes */}
            {humanizerNotes && (
              <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-1.5 text-xs">
                <span className="font-bold text-purple-300 flex items-center gap-1">
                  <Wand2 className="h-3.5 w-3.5" /> Humanizer Pass Applied
                </span>
                <p className="text-slate-300 text-[11px] whitespace-pre-line leading-relaxed">
                  {humanizerNotes}
                </p>
              </div>
            )}

            {/* Audit notes */}
            {auditResult && (
              <div
                className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                  auditResult.auditStatus === "PASSED"
                    ? "border-emerald-500/30 bg-emerald-950/20"
                    : "border-amber-500/30 bg-amber-950/20"
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span
                    className={
                      auditResult.auditStatus === "PASSED" ? "text-emerald-300" : "text-amber-300"
                    }
                  >
                    Audit: {auditResult.auditStatus}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{auditResult.wordCount} words</span>
                </div>
                <p className="text-slate-300 text-[11px] whitespace-pre-line leading-relaxed">
                  {auditResult.auditNotes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publish Modal / Manual Fallback Notification */}
      {publishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-w-md w-full rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
              <h4 className="text-lg font-bold text-white">
                {publishModal.mode === "publora" ? "Post Published / Scheduled!" : "Ready for Copy & Paste"}
              </h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {publishModal.message || "Your post is approved and copy-ready."}
            </p>

            {publishModal.copyReadyText && (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {publishModal.copyReadyText}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(publishModal.copyReadyText);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied to Clipboard!" : "Copy Post Text"}
                </button>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPublishModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
