import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BookmarkCheck, Bookmark, Zap, Building2, MapPin, DollarSign } from "lucide-react";
import { useState } from "react";
import { ApiClient } from "../lib/api";
import { formatRelativeTime, formatSalary } from "../lib/utils";

export default function SavedJobsPage() {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["savedJobs"],
    queryFn: () => ApiClient.getSavedJobs(),
  });

  const jobs: any[] = data?.data || data?.jobs || (Array.isArray(data) ? data : []);

  const handleUnsave = async (id: string) => {
    try { await ApiClient.unsaveJob(id); refetch(); } catch (e) { console.error(e); }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookmarkCheck className="w-6 h-6 text-indigo-400" /> Saved Jobs
        </h1>
        <p className="text-sm text-slate-400 mt-1">{jobs.length} job{jobs.length !== 1 ? "s" : ""} saved</p>
      </div>

      {jobs.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
          <Bookmark className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Saved Jobs</h3>
          <p className="text-xs text-slate-400">Browse jobs and click the bookmark icon to save them here.</p>
          <button onClick={() => navigate("/jobs")} className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
            Browse Jobs
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job: any) => (
            <div key={job.id} onClick={() => navigate(`/jobs/${job.id}`)}
              className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-indigo-500/30 transition-all cursor-pointer group space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{job.title}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400">
                    <Building2 className="w-3 h-3" />{job.company_name}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleUnsave(job.id); }}
                  className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 transition-colors">
                  <BookmarkCheck className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                {(job.salary_min || job.salary_max) && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</span>}
                <span className="ml-auto">{formatRelativeTime(job.saved_at || job.posted_at)}</span>
              </div>

              <button onClick={(e) => { e.stopPropagation(); navigate(`/setup?job_id=${job.id}&role=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company_name)}`); }}
                className="w-full py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-1.5 transition-colors">
                <Zap className="w-3.5 h-3.5" /> Prepare Interview
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
