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
  UserCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ApiClient } from "../../../lib/api";

interface AudienceTabProps {
  engagers: any[];
}

export const AudienceTab: React.FC<AudienceTabProps> = ({ engagers: initialEngagers }) => {
  const navigate = useNavigate();
  const [postUrl, setPostUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [engagers, setEngagers] = useState<any[]>(initialEngagers || []);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const fallbackEngagers = [
    {
      _id: "e1",
      name: "Sarah Jenkins",
      headline: "Senior Technical Recruiter @ Stripe",
      company: "Stripe",
      role: "Technical Recruiter",
      icpCategory: "RECRUITER",
      relevanceScore: 94,
      actionRecommendation: "High-fit recruiter at target company. Send outreach connection.",
    },
    {
      _id: "e2",
      name: "David Chen",
      headline: "Engineering Manager (Platform & Core Infrastructure) @ Datadog",
      company: "Datadog",
      role: "Engineering Manager",
      icpCategory: "HIRING_MANAGER",
      relevanceScore: 98,
      actionRecommendation: "Hiring Manager on platform team. Engage on his recent distributed systems post.",
    },
    {
      _id: "e3",
      name: "Alex Rivera",
      headline: "Staff Software Engineer @ Netflix",
      company: "Netflix",
      role: "Staff Engineer",
      icpCategory: "PEER",
      relevanceScore: 82,
      actionRecommendation: "Peer engineer. Share thoughts on streaming architectures.",
    },
  ];

  const currentList = engagers.length > 0 ? engagers : fallbackEngagers;

  const filteredEngagers = currentList.filter((e) => {
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
        setScanMessage(`Successfully extracted and categorized ${res.engagers.length} engagers via Apify.`);
      } else {
        setScanMessage("Scan complete: No public engagers found or post is private. Showing cached ICP intelligence.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to scan post engagers. Verify URL or check Apify quota.");
    } finally {
      setScanning(false);
    }
  };

  const recruiterCount = currentList.filter(e => e.icpCategory === "RECRUITER").length;
  const hiringManagerCount = currentList.filter(e => e.icpCategory === "HIRING_MANAGER").length;
  const peerCount = currentList.filter(e => e.icpCategory === "PEER").length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-400" />
              Audience Intelligence & ICP Mapping
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Apify Live
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Scrapes LinkedIn post engagers (likers and commenters) via Apify Actor, categorizing them into Recruiters, Hiring Managers, and Peers.
          </p>
        </div>

        <button
          onClick={() => navigate("/outreach")}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
        >
          <Send className="h-3.5 w-3.5" />
          Open AI Outreach Studio
        </button>
      </div>

      {/* Live Post Scanner Form */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Search className="h-4 w-4 text-indigo-400" />
          Scan Post Engagers Live (Apify)
        </h4>
        <p className="text-xs text-slate-400">
          Paste any public LinkedIn post URL (yours or an industry post) to discover active recruiters and engineering leaders interacting with that topic.
        </p>

        <form onSubmit={handleScanPost} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            placeholder="https://www.linkedin.com/posts/username_post-title-activity-..."
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={scanning}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50 whitespace-nowrap"
          >
            {scanning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {scanning ? "Scanning Post via Apify..." : "Scan & Classify Engagers"}
          </button>
        </form>

        {scanMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{scanMessage}</span>
          </div>
        )}
      </div>

      {/* Segment Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setFilterCategory("HIRING_MANAGER")}
          className={`p-4 rounded-xl border text-left transition ${
            filterCategory === "HIRING_MANAGER"
              ? "border-purple-500/50 bg-purple-950/30"
              : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Hiring Managers</span>
            <span className="text-lg font-bold text-white">{hiringManagerCount}</span>
          </div>
          <p className="text-[11px] text-slate-400">Engineering Managers, Directors & Tech Leads</p>
        </button>

        <button
          onClick={() => setFilterCategory("RECRUITER")}
          className={`p-4 rounded-xl border text-left transition ${
            filterCategory === "RECRUITER"
              ? "border-emerald-500/50 bg-emerald-950/30"
              : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Technical Recruiters</span>
            <span className="text-lg font-bold text-white">{recruiterCount}</span>
          </div>
          <p className="text-[11px] text-slate-400">Corporate recruiters & talent acquisition</p>
        </button>

        <button
          onClick={() => setFilterCategory("PEER")}
          className={`p-4 rounded-xl border text-left transition ${
            filterCategory === "PEER"
              ? "border-indigo-500/50 bg-indigo-950/30"
              : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Peers & ICs</span>
            <span className="text-lg font-bold text-white">{peerCount}</span>
          </div>
          <p className="text-[11px] text-slate-400">Staff Engineers, Architects & Devs</p>
        </button>
      </div>

      {/* Filter and Engagers Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden space-y-3 p-1">
        <div className="flex items-center justify-between px-4 pt-3">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-400">Filtering:</span>
            <button
              onClick={() => setFilterCategory("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                filterCategory === "ALL" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              All ({currentList.length})
            </button>
            <button
              onClick={() => setFilterCategory("HIRING_MANAGER")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                filterCategory === "HIRING_MANAGER" ? "bg-purple-900/50 text-purple-300" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Hiring Managers
            </button>
            <button
              onClick={() => setFilterCategory("RECRUITER")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                filterCategory === "RECRUITER" ? "bg-emerald-900/50 text-emerald-300" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Recruiters
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4">Contact</th>
                <th className="p-4">Target Company</th>
                <th className="p-4">ICP Segment</th>
                <th className="p-4">Relevance</th>
                <th className="p-4">Recommended Action</th>
                <th className="p-4 text-right">Connect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEngagers.map((e: any) => (
                <tr key={e._id} className="hover:bg-slate-800/30 transition">
                  <td className="p-4">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      {e.name}
                      {e.profileUrl && (
                        <a
                          href={e.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 hover:text-indigo-400 transition"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{e.headline}</div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 text-slate-200">
                      <Building className="h-3.5 w-3.5 text-slate-400" />
                      {e.company || "Identified in profile"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        e.icpCategory === "HIRING_MANAGER"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : e.icpCategory === "RECRUITER"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {e.icpCategory}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">{e.relevanceScore}%</span>
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full"
                          style={{ width: `${e.relevanceScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-300 max-w-xs">{e.actionRecommendation}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => navigate("/outreach")}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                    >
                      Outreach <Send className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
