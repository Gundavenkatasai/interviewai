import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, MapPin, DollarSign, Clock, Building2, ExternalLink, Bookmark,
  BookmarkCheck, Zap, Star, AlertCircle, Briefcase, Calendar, FileText, Sparkles,
  Check, ChevronDown, ChevronUp, Layers, Brain
} from "lucide-react";
import { useState } from "react";
import { ApiClient } from "../lib/api";
import { formatRelativeTime, formatSalary, getCompanyPortalUrl } from "../lib/utils";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: () => ApiClient.getJob(id!),
    enabled: !!id,
  });

  const { data: matchDoc } = useQuery({
    queryKey: ["jobMatch", id],
    queryFn: () => ApiClient.getJobMatch(id!),
    enabled: !!id,
  });

  const { data: explanation } = useQuery({
    queryKey: ["jobExplanation", id],
    queryFn: () => ApiClient.getJobExplanation(id!),
    enabled: !!id && !!matchDoc,
  });

  const handleSave = async () => {
    try {
      if (saved) { await ApiClient.unsaveJob(id!); setSaved(false); }
      else { await ApiClient.saveJob(id!); setSaved(true); }
    } catch (e) { console.error(e); }
  };

  const handlePrepare = () => {
    const params = new URLSearchParams({
      job_id: id!,
      role: job?.title || "",
      company: job?.company_name || "",
      jd: job?.description?.slice(0, 300) || "",
    });
    navigate(`/setup?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Job Not Found</h2>
        <Link to="/jobs" className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">Back to Jobs</Link>
      </div>
    );
  }

  const matchScore = matchDoc?.matchScore != null ? Math.round(matchDoc.matchScore) : null;
  const trustScore = matchDoc?.trustScore != null ? Math.round(matchDoc.trustScore) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back */}
      <Link to="/jobs" className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to Jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Header */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-white">{job.title}</h1>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                  <Building2 className="w-4 h-4" />
                  <span>{job.company_name}</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 text-xl font-bold shrink-0">
                {job.company_name?.[0]?.toUpperCase() || "?"}
              </div>
            </div>

            {/* Stale Job Protection */}
            {job.createdAt && new Date(job.createdAt).getTime() < Date.now() - 45 * 24 * 60 * 60 * 1000 && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>This job posting is over 45 days old. It may no longer be actively accepting applications.</p>
              </div>
            )}

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              {job.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{job.location}</span>}
              {(job.salary_min || job.salary_max) && <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" />{formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</span>}
              {job.work_mode && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{job.work_mode}</span>}
              {job.job_type && <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" />{job.job_type}</span>}
              {(job.source_posted_at || job.posted_at) && <span className="flex items-center gap-1.5" title={job.posting_date_confidence === "high" || job.posting_date_confidence === "medium" ? "Employer posting date" : "Approximate date"}><Calendar className="w-3.5 h-3.5" />{formatRelativeTime(job.source_posted_at || job.posted_at)}{(job.posting_date_confidence !== "high" && job.posting_date_confidence !== "medium") && <span className="text-slate-600">~</span>}</span>}
            </div>

            {/* Skills */}
            {job.skills?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill: string) => (
                    <span key={skill} className="px-2.5 py-1 rounded-lg text-xs bg-slate-950 border border-slate-800 text-slate-300">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {(() => {
              const applyUrl = job.apply_url || job.application_url || job.source_url || null;
              const handleApplyClick = async () => {
                if (!applyUrl) return;
                try { await ApiClient.trackApplyClick(job.id); } catch (_) {}
                window.open(applyUrl, "_blank", "noopener,noreferrer");
              };

              return (
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/60">
                  {applyUrl && (
                    <button
                      onClick={handleApplyClick}
                      className="flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/25 cursor-pointer"
                      title={`Apply on ${job.source || 'source'}`}
                    >
                      <ExternalLink className="w-4 h-4" /> Apply on {job.source ? job.source.charAt(0).toUpperCase() + job.source.slice(1) : 'Site'}
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/jobs/${id}/apply`)}
                    className="py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4" /> Log Application
                  </button>
                  <button
                    onClick={() => navigate(`/outreach?jobId=${id}`)}
                    className="py-2.5 px-4 rounded-xl text-sm font-semibold text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-pink-400" /> AI Outreach
                  </button>
                  <button
                    onClick={() => navigate(`/intelligence/${id}`)}
                    className="py-2.5 px-4 rounded-xl text-sm font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Brain className="w-4 h-4 text-emerald-400" /> Interview Prep
                  </button>
                  <button
                    onClick={async () => {
                       try {
                         await ApiClient.startPipeline(id!);
                         navigate('/auto-apply'); // Routes to Pipeline Dashboard
                       } catch (e) { console.error(e) }
                    }}
                    className="py-2.5 px-4 rounded-xl text-sm font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-indigo-400" /> Prepare Application
                  </button>
                  <button onClick={handleSave}
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${saved ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "border-slate-700 text-slate-400 hover:text-white"}`}>
                    {saved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Description */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <h2 className="text-sm font-bold text-white mb-4">Job Description</h2>
            {job.description ? (
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{job.description}</div>
            ) : (
              <p className="text-sm text-slate-500">No detailed description available. Click "Apply" to view on the original site.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Match Score Card */}
          {matchScore != null && (
            <div className={`p-5 rounded-2xl border ${matchScore >= 80 ? "bg-emerald-500/5 border-emerald-500/20" : matchScore >= 60 ? "bg-amber-500/5 border-amber-500/20" : "bg-slate-900/50 border-slate-800/80"}`}>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-yellow-400" />
                <h3 className="text-sm font-bold text-white">AI Match Score</h3>
              </div>
              <div className={`text-4xl font-extrabold mb-2 ${matchScore >= 80 ? "text-emerald-400" : matchScore >= 60 ? "text-amber-400" : "text-slate-400"}`}>
                {matchScore}%
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-all ${matchScore >= 80 ? "bg-emerald-500" : matchScore >= 60 ? "bg-amber-500" : "bg-slate-500"}`}
                  style={{ width: `${matchScore}%` }} />
              </div>

              {matchDoc?.hardConstraints?.length > 0 && matchDoc.hardConstraints.some((c:any) => c.status === "BLOCKER") && (
                <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-xs text-red-400 font-bold flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Hard Blocker</p>
                  <ul className="mt-1 space-y-1">
                    {matchDoc.hardConstraints.filter((c:any) => c.status === "BLOCKER").map((c:any, i:number) => (
                      <li key={i} className="text-xs text-red-300">• {c.reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {matchDoc?.matchedSkills?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-slate-400 font-semibold mb-1.5">✓ Your Matching Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {matchDoc.matchedSkills.slice(0, 6).map((s: string) => (
                      <span key={s} className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {matchDoc?.missingSkills?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-slate-400 font-semibold mb-1.5">⚠ Missing Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {matchDoc.missingSkills.slice(0, 6).map((s: string) => (
                      <span key={s} className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {matchDoc?.unknownSignals?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 font-semibold mb-1.5">? Unknown Signals</p>
                  <div className="flex flex-wrap gap-1">
                    {matchDoc.unknownSignals.slice(0, 4).map((s: string) => (
                      <span key={s} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate(`/jobs/${id}/tailor`)}
                className="mt-5 w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/25 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> Analyze & Tailor Resume
              </button>
            </div>
          )}

          {/* Trust Score */}
          {trustScore != null && (
            <div className={`p-5 rounded-2xl border ${trustScore >= 80 ? "bg-blue-500/5 border-blue-500/20" : trustScore >= 50 ? "bg-yellow-500/5 border-yellow-500/20" : "bg-red-500/5 border-red-500/20"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">Job Trust Score</h3>
                </div>
                <button onClick={() => setShowEvidence(!showEvidence)} className="text-slate-400 hover:text-white transition-colors">
                  {showEvidence ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
              <div className={`text-3xl font-extrabold ${trustScore >= 80 ? "text-blue-400" : trustScore >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                {trustScore}%
              </div>
              
              {showEvidence && job.trustDetails && (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trust Evidence</p>
                  <ul className="space-y-1.5">
                    {job.trustDetails.reasons?.map((r: string, i: number) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                  {job.trustDetails.flags?.length > 0 && (
                    <ul className="space-y-1.5 mt-2">
                      {job.trustDetails.flags.map((r: string, i: number) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AI Explanation */}
          {explanation && (
            <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-4">
              {explanation.whyThisJob?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-indigo-400 mb-2 uppercase tracking-wider">Why This Job?</h4>
                  <ul className="space-y-1.5">
                    {explanation.whyThisJob.map((item: string, i: number) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {explanation.whyNot?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">Gaps</h4>
                  <ul className="space-y-1.5">
                    {explanation.whyNot.map((item: string, i: number) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Quick Info */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
            <h3 className="text-sm font-bold text-white">Job Details</h3>
            {[
              { label: "Source", value: job.source },
              { label: "Experience", value: job.experience_level },
              { label: "Remote Policy", value: job.work_mode },
              { label: "Job Type", value: job.job_type },
            ].filter(d => d.value).map(d => (
              <div key={d.label} className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{d.label}</span>
                <span className="text-slate-300 font-medium">{d.value}</span>
              </div>
            ))}
          </div>

          {/* Also Found On (Duplicate Cluster) */}
          {job.duplicates && job.duplicates.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Also Found On</h3>
              </div>
              <div className="space-y-2">
                {job.duplicates.map((dup: any) => (
                  <Link key={dup.id} to={`/jobs/${dup.id}`} className="block p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{dup.source?.charAt(0).toUpperCase() + dup.source?.slice(1)}</span>
                      {dup.trustScore != null && (
                        <span className={`px-1.5 py-0.5 rounded ${dup.trustScore >= 80 ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                          {Math.round(dup.trustScore)} Trust
                        </span>
                      )}
                    </div>
                    {dup.posted_at && <span className="text-[10px] text-slate-500 mt-1 block">Posted {formatRelativeTime(dup.posted_at)}</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <button onClick={handlePrepare}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-500/20">
            <Zap className="w-4 h-4" /> Start Mock Interview
          </button>
        </div>
      </div>
    </div>
  );
}
