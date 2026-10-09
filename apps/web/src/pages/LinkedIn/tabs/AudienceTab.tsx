import React, { useState } from "react";
import {
  Users,
  ExternalLink,
  Send,
  Building,
  ShieldCheck,
  Briefcase,
  Search,
  Sparkles,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info
} from "lucide-react";
import { ApiClient } from "../../../lib/api";

interface AudienceTabProps {
  engagers: any[];
}

export const AudienceTab: React.FC<AudienceTabProps> = ({ engagers: initialEngagers }) => {
  const [postUrl, setPostUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [engagers, setEngagers] = useState<any[]>(initialEngagers || []);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const filteredEngagers = engagers.filter((e) => {
    if (filterCategory === "ALL") return true;
    return e.icpCategory === filterCategory;
  });

  const handleScanPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postUrl.trim()) return;

    setScanning(true);
    setScanMessage(null);
    try {
      const res = await ApiClient.scanLinkedInEngagers(postUrl.trim());
      if (res.engagers && res.engagers.length > 0) {
        setEngagers(res.engagers);
        setScanMessage(`Observed ${res.engagers.length} public engagers from post.`);
      } else {
        setScanMessage("Public scan complete: No public commenters returned or post has restricted visibility.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to scan post engagers. Verify URL accessibility.");
    } finally {
      setScanning(false);
    }
  };

  const recruiterCount = engagers.filter((e) => e.icpCategory === "RECRUITER").length;
  const hiringManagerCount = engagers.filter((e) => e.icpCategory === "HIRING_MANAGER").length;
  const peerCount = engagers.filter((e) => e.icpCategory === "PEER").length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-400" />
            Audience Intelligence & Public Post Signals
          </h3>
          <p className="text-xs text-slate-400">
            Real observed commenters and reactions. Private or inferred profiles are never fabricated.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Strictly Public Signals</span>
        </div>
      </div>

      {/* Scanner Bar */}
      <form
        onSubmit={handleScanPost}
        className="flex flex-col sm:flex-row items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4"
      >
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs flex-1 w-full">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            placeholder="Paste public LinkedIn post URL to extract engagers (e.g. https://www.linkedin.com/posts/...)"
            className="bg-transparent text-white focus:outline-none w-full text-xs"
          />
        </div>

        <button
          type="submit"
          disabled={scanning}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50 shrink-0"
        >
          {scanning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          Extract Engagers
        </button>
      </form>

      {scanMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <Info className="h-4 w-4 text-indigo-400" />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Category Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFilterCategory("ALL")}
          className={`p-3.5 rounded-xl border text-left transition ${
            filterCategory === "ALL"
              ? "border-indigo-500 bg-indigo-600/10 text-white"
              : "border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block">All Contacts</span>
          <span className="text-xl font-bold text-white mt-1 block">{engagers.length}</span>
        </button>

        <button
          onClick={() => setFilterCategory("HIRING_MANAGER")}
          className={`p-3.5 rounded-xl border text-left transition ${
            filterCategory === "HIRING_MANAGER"
              ? "border-emerald-500 bg-emerald-600/10 text-white"
              : "border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-400">
            Hiring Managers
          </span>
          <span className="text-xl font-bold text-white mt-1 block">{hiringManagerCount}</span>
        </button>

        <button
          onClick={() => setFilterCategory("RECRUITER")}
          className={`p-3.5 rounded-xl border text-left transition ${
            filterCategory === "RECRUITER"
              ? "border-purple-500 bg-purple-600/10 text-white"
              : "border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block text-purple-400">
            Recruiters
          </span>
          <span className="text-xl font-bold text-white mt-1 block">{recruiterCount}</span>
        </button>

        <button
          onClick={() => setFilterCategory("PEER")}
          className={`p-3.5 rounded-xl border text-left transition ${
            filterCategory === "PEER"
              ? "border-cyan-500 bg-cyan-600/10 text-white"
              : "border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block text-cyan-400">
            Peers & Engineers
          </span>
          <span className="text-xl font-bold text-white mt-1 block">{peerCount}</span>
        </button>
      </div>

      {/* Engagers List or Truthful Empty State */}
      <div className="space-y-3">
        {filteredEngagers.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-2 text-slate-500 text-xs">
            <Users className="mx-auto h-8 w-8 text-slate-600" />
            <p>No public engagers found for this filter.</p>
            <p className="text-[11px] text-slate-600">
              Paste a public LinkedIn post URL above to extract visible participants without credentials.
            </p>
          </div>
        ) : (
          filteredEngagers.map((engager, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">{engager.name}</h4>
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                    {engager.icpCategory || "OBSERVED"}
                  </span>
                </div>

                <p className="text-xs text-slate-300">{engager.headline || "LinkedIn Member"}</p>

                {engager.company && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-0.5">
                    <Building className="h-3 w-3" /> {engager.company}
                  </p>
                )}
              </div>

              {engager.profileUrl && (
                <a
                  href={engager.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> View
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
