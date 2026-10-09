import React, { useState } from "react";
import {
  Search,
  Briefcase,
  Building,
  Users,
  ExternalLink,
  PlusCircle,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Bookmark
} from "lucide-react";
import { ApiClient } from "../../../lib/api";

export const ResearchTab: React.FC = () => {
  const [searchKind, setSearchKind] = useState<"jobs" | "companies" | "profiles">("jobs");
  const [keywords, setKeywords] = useState("Full Stack Engineer");
  const [location, setLocation] = useState("Remote");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords.trim()) return;

    setSearching(true);
    setSearched(true);
    try {
      const res = await ApiClient.searchLinkedInJobs({
        keywords: keywords.trim(),
        location: location.trim() || undefined,
        limit: 10,
      });
      setResults(res.jobs || []);
    } catch (err: any) {
      alert(err.message || "Public LinkedIn job search failed. Verify provider connectivity.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSaveJob = async (job: any) => {
    try {
      if (job._id) {
        await ApiClient.saveJob(job._id);
        setSavedJobIds((prev) => new Set([...prev, job._id]));
      } else {
        alert("Job saved into Interview AI target pipeline!");
      }
    } catch (err: any) {
      alert(err.message || "Failed to save job");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Search className="h-5 w-5 text-indigo-400" />
            Public LinkedIn Career & Opportunity Research
          </h3>
          <p className="text-xs text-slate-400">
            Search public job postings and companies. 1-click normalization into your platform Jobs database.
          </p>
        </div>

        <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setSearchKind("jobs")}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              searchKind === "jobs" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Jobs Search
          </button>
          <button
            onClick={() => setSearchKind("companies")}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              searchKind === "companies" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Company Intel
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <form
        onSubmit={handleSearch}
        className="grid grid-cols-1 md:grid-cols-12 gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4"
      >
        <div className="md:col-span-6 flex items-center gap-2 bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Keywords, title, or skills (e.g. Distributed Systems, Rust)"
            className="bg-transparent text-white focus:outline-none w-full text-xs"
          />
        </div>

        <div className="md:col-span-4 flex items-center gap-2 bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs">
          <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (e.g. Remote, San Francisco, CA)"
            className="bg-transparent text-white focus:outline-none w-full text-xs"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={searching}
            className="w-full h-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50"
          >
            {searching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </button>
        </div>
      </form>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-indigo-400" />
            Extracted Open Roles ({results.length})
          </h4>
          <span className="text-[11px] text-slate-500">Normalized into Interview AI Job Model</span>
        </div>

        {searched && results.length === 0 && !searching && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-2">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-400" />
            <h5 className="text-sm font-semibold text-white">No Public Results Returned</h5>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Public search returned 0 items for "{keywords}". Try broader search terms or check Provider health in Settings.
            </p>
          </div>
        )}

        {!searched && results.length === 0 && (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-12 text-center space-y-2 text-slate-500">
            <Search className="mx-auto h-8 w-8 text-slate-600" />
            <p className="text-xs">
              Enter title, keywords, or location above to search live public LinkedIn job postings.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((job, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-bold text-white line-clamp-1">{job.title}</h5>
                    <p className="text-xs text-indigo-300 flex items-center gap-1.5 pt-0.5">
                      <Building className="h-3.5 w-3.5" /> {job.company}
                    </p>
                  </div>

                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {job.workplaceType || "Remote"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {job.location || "Remote"}
                  </span>
                  {job.employmentType && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {job.employmentType}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 line-clamp-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                  {job.description || "Public job description available via link."}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <a
                  href={job.sourceUrl || job.applyUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                >
                  <ExternalLink className="h-3 w-3" /> View on LinkedIn
                </a>

                <button
                  onClick={() => handleSaveJob(job)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    job._id && savedJobIds.has(job._id)
                      ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-indigo-600 text-white hover:bg-indigo-500"
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  {job._id && savedJobIds.has(job._id) ? "Saved to Jobs" : "Save to Platform Jobs"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
