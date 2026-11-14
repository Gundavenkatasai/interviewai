import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, MapPin, DollarSign, Clock, Building2, ExternalLink, Bookmark,
  BookmarkCheck, Zap, Star, AlertCircle, Briefcase, Calendar, FileText, Sparkles,
  Check, ChevronDown, ChevronUp, Layers, Brain, Compass
} from "lucide-react";
import { useState } from "react";
import { ApiClient } from "../lib/api";
import { formatRelativeTime, formatSalary } from "../lib/utils";
import { MechanicalButton } from "../components/ui/MechanicalButton";
import { InkBleedButton } from "../components/ui/InkBleedButton";

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
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#F5F3EE]">
        <div className="w-8 h-8 rounded-full border-2 border-[#C84B26]/20 border-t-[#C84B26] animate-spin mb-3" />
        <span className="font-mono text-xs uppercase tracking-widest text-[#181614]/60">Parsing Flight Index Slip...</span>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4 bg-[#F5F3EE]">
        <div className="w-12 h-12 rounded-full bg-[#FCEEEE] border border-[#9E2A2B]/20 flex items-center justify-center mx-auto text-[#9E2A2B]">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-serif font-bold text-[#181614]">Ticket Reference Not Found</h2>
        <p className="text-xs text-[#181614]/70">This job posting index slip may have been archived or removed from the board.</p>
        <Link to="/jobs" className="inline-block px-4 py-2 rounded bg-[#172535] text-white text-xs font-mono font-medium hover:bg-[#181614] transition-colors">
          Return to Boarding Board
        </Link>
      </div>
    );
  }

  const matchScore = matchDoc?.matchScore != null ? Math.round(matchDoc.matchScore) : null;
  const trustScore = matchDoc?.trustScore != null ? Math.round(matchDoc.trustScore) : null;

  return (
    <div className="min-h-screen bg-[#F5F3EE] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Return */}
        <div className="flex items-center justify-between">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#181614]/70 hover:text-[#C84B26] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Boarding Board
          </Link>
          <div className="font-mono text-[11px] text-[#181614]/50">
            TICKET ID: #{id?.slice(-8).toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Flight Slip Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* The Physical Boarding Pass Card */}
            <div className="bg-white rounded-lg border border-[#E5E0D4] shadow-sm overflow-hidden">
              {/* Slip Top Perforation Header */}
              <div className="p-6 bg-[#FAF8F5] border-b border-dashed border-[#DCD5C6] flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#172535] text-white font-mono text-[10px] uppercase tracking-wider">
                      {job.source ? job.source.toUpperCase() : "VERIFIED REQUISITION"}
                    </span>
                    {job.work_mode && (
                      <span className="px-2 py-0.5 rounded bg-white border border-[#E5E0D4] font-mono text-[10px] text-[#181614]">
                        {job.work_mode.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-[#181614] tracking-tight pt-1">
                    {job.title}
                  </h1>
                  <div className="flex items-center gap-2 text-sm font-medium text-[#181614]/80">
                    <Building2 className="w-4 h-4 text-[#C84B26]" />
                    <span>{job.company_name}</span>
                  </div>
                </div>

                <div className="w-14 h-14 rounded border border-[#E5E0D4] bg-white flex items-center justify-center text-lg font-serif font-bold text-[#172535] shrink-0 shadow-inner">
                  {job.company_name?.[0]?.toUpperCase() || "J"}
                </div>
              </div>

              {/* Stale Job Notice */}
              {job.createdAt && new Date(job.createdAt).getTime() < Date.now() - 45 * 24 * 60 * 60 * 1000 && (
                <div className="mx-6 mt-6 flex items-start gap-2.5 p-3 rounded bg-[#FDF6E9] border border-[#A36114]/20 text-[#A36114] text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>Posting age exceeds 45 days. Verify active candidate intake prior to formal submission.</p>
                </div>
              )}

              {/* Slip Metadata Shelf */}
              <div className="p-6 space-y-6">
                <div className="flex flex-wrap gap-4 text-xs font-mono text-[#181614]/80 border-b border-[#E5E0D4] pb-4">
                  {job.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#C84B26]" /> {job.location}
                    </span>
                  )}
                  {(job.salary_min || job.salary_max) && (
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#2E6347]" /> {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                    </span>
                  )}
                  {job.job_type && (
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#172535]" /> {job.job_type}
                    </span>
                  )}
                  {(job.source_posted_at || job.posted_at) && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#181614]/50" /> {formatRelativeTime(job.source_posted_at || job.posted_at)}
                    </span>
                  )}
                </div>

                {/* Requisition Skills */}
                {job.skills?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-[#181614]/60 mb-2.5">
                      Target Competencies & Toolchain
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills.map((skill: any, idx: number) => {
                        const skillName = typeof skill === "string" ? skill : skill?.name || `Skill-${idx}`;
                        return (
                          <span
                            key={skillName + idx}
                            className="px-2.5 py-1 rounded bg-[#F5F3EE] border border-[#E5E0D4] text-[#181614] font-mono text-xs"
                          >
                            {skillName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                {(() => {
                  const applyUrl = job.apply_url || job.application_url || job.source_url || null;
                  const handleApplyClick = async () => {
                    if (!applyUrl) return;
                    try { await ApiClient.trackApplyClick(job.id); } catch (_) {}
                    window.open(applyUrl, "_blank", "noopener,noreferrer");
                  };

                  return (
                    <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#E5E0D4]">
                      {applyUrl && (
                        <MechanicalButton
                          variant="vermilion"
                          onClick={handleApplyClick}
                          icon={<ExternalLink className="w-4 h-4" />}
                        >
                          Apply on {job.source ? job.source.charAt(0).toUpperCase() + job.source.slice(1) : "Portal"}
                        </MechanicalButton>
                      )}
                      <MechanicalButton
                        variant="navy"
                        onClick={() => navigate(`/jobs/${id}/tailor`)}
                        icon={<FileText className="w-4 h-4" />}
                      >
                        Tailor Resume
                      </MechanicalButton>
                      <InkBleedButton
                        onClick={() => navigate(`/intelligence/${id}`)}
                      >
                        <Brain className="w-4 h-4 text-[#2E6347]" />
                        <span>Prep Briefing</span>
                      </InkBleedButton>
                      <button
                        onClick={handleSave}
                        className={`p-2.5 rounded border transition-colors cursor-pointer ${
                          saved
                            ? "bg-[#EBF3EE] border-[#D0E3D6] text-[#2E6347]"
                            : "border-[#E5E0D4] text-[#181614]/60 hover:text-[#181614] bg-white"
                        }`}
                        title="Bookmark ticket"
                      >
                        {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Requisition Spec / Description */}
            <div className="bg-white rounded-lg border border-[#E5E0D4] shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E0D4] pb-3">
                <h2 className="font-serif font-bold text-base text-[#181614]">Requisition Specification</h2>
                <span className="font-mono text-[11px] text-[#181614]/50">DOCUMENT SECTION 01</span>
              </div>
              {job.description ? (
                <div className="text-xs text-[#181614]/85 leading-relaxed whitespace-pre-wrap font-sans">
                  {job.description}
                </div>
              ) : (
                <p className="text-xs text-[#181614]/50 italic">
                  Complete requisition copy not provided in index feed. Open application portal above to inspect full text.
                </p>
              )}
            </div>
          </div>

          {/* Right Flight Telemetry Inspector */}
          <div className="space-y-5">
            {/* AI Match Needle Gauge */}
            {matchScore != null && (
              <div className="bg-white rounded-lg border border-[#E5E0D4] shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E0D4] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#C84B26]" />
                    <h3 className="font-mono text-xs uppercase tracking-wider text-[#181614] font-semibold">
                      Match Telemetry
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#C84B26]">
                    {matchScore}%
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="h-2 w-full bg-[#F5F3EE] rounded-full overflow-hidden border border-[#E5E0D4]">
                    <div
                      className="h-full bg-[#C84B26] transition-all duration-500"
                      style={{ width: `${matchScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between font-mono text-[10px] text-[#181614]/50 pt-0.5">
                    <span>BASELINE 0</span>
                    <span>FLIGHT READY 85+</span>
                  </div>
                </div>

                {matchDoc?.hardConstraints?.length > 0 && matchDoc.hardConstraints.some((c: any) => c.status === "BLOCKER") && (
                  <div className="p-3 bg-[#FCEEEE] border border-[#9E2A2B]/20 rounded text-[#9E2A2B] text-xs">
                    <p className="font-mono font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Requisition Blocker
                    </p>
                    <ul className="space-y-1">
                      {matchDoc.hardConstraints.filter((c: any) => c.status === "BLOCKER").map((c: any, i: number) => (
                        <li key={i} className="text-[11px]">• {c.reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {matchDoc?.matchedSkills?.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-[#2E6347] font-semibold mb-2">
                      ✓ Profile Intersections ({matchDoc.matchedSkills.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {matchDoc.matchedSkills.slice(0, 6).map((s: any, idx: number) => {
                        const skillName = typeof s === "string" ? s : s?.name || `Skill-${idx}`;
                        return (
                          <span key={skillName + idx} className="px-2 py-0.5 rounded text-[11px] bg-[#EBF3EE] text-[#2E6347] border border-[#D0E3D6] font-mono">
                            {skillName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {matchDoc?.missingSkills?.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-[#A36114] font-semibold mb-2">
                      ⚠ Identified Gaps ({matchDoc.missingSkills.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {matchDoc.missingSkills.slice(0, 6).map((s: any, idx: number) => {
                        const skillName = typeof s === "string" ? s : s?.name || `Skill-${idx}`;
                        return (
                          <span key={skillName + idx} className="px-2 py-0.5 rounded text-[11px] bg-[#FDF6E9] text-[#A36114] border border-[#A36114]/20 font-mono">
                            {skillName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <MechanicalButton
                    variant="navy"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/jobs/${id}/tailor`)}
                    icon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    Draft Tailored Bullets
                  </MechanicalButton>
                </div>
              </div>
            )}

            {/* Trust Telemetry Gauge */}
            {trustScore != null && (
              <div className="bg-white rounded-lg border border-[#E5E0D4] shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#181614] uppercase tracking-wider">
                    <Star className="w-3.5 h-3.5 text-[#C84B26]" />
                    <span>Integrity Score</span>
                  </div>
                  <button
                    onClick={() => setShowEvidence(!showEvidence)}
                    className="text-[#181614]/50 hover:text-[#181614] text-xs font-mono"
                  >
                    {showEvidence ? "[HIDE]" : "[INSPECT]"}
                  </button>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-serif font-bold text-[#181614]">{trustScore}%</span>
                  <span className="font-mono text-[11px] text-[#2E6347]">VERIFIED EMPLOYER</span>
                </div>

                {showEvidence && job.trustDetails && (
                  <div className="pt-3 border-t border-[#E5E0D4] space-y-2">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#181614]/60">Source Evidence</p>
                    <ul className="space-y-1">
                      {job.trustDetails.reasons?.map((r: string, i: number) => (
                        <li key={i} className="text-xs text-[#181614]/80 flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#2E6347] shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Why This Job / Gaps Breakdown */}
            {explanation && (
              <div className="bg-white rounded-lg border border-[#E5E0D4] shadow-sm p-5 space-y-4">
                {explanation.whyThisJob?.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-mono uppercase tracking-wider text-[#2E6347] font-semibold mb-2">
                      Alignment Justifications
                    </h4>
                    <ul className="space-y-1.5">
                      {explanation.whyThisJob.map((item: string, i: number) => (
                        <li key={i} className="text-xs text-[#181614]/80 flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#2E6347] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {explanation.whyNot?.length > 0 && (
                  <div className="pt-2 border-t border-[#E5E0D4]">
                    <h4 className="text-[10px] font-mono uppercase tracking-wider text-[#A36114] font-semibold mb-2">
                      Friction Points
                    </h4>
                    <ul className="space-y-1.5">
                      {explanation.whyNot.map((item: string, i: number) => (
                        <li key={i} className="text-xs text-[#181614]/80 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-[#A36114] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Rehearsal Stage Trigger */}
            <MechanicalButton
              variant="vermilion"
              size="lg"
              className="w-full"
              onClick={handlePrepare}
              icon={<Zap className="w-4 h-4" />}
            >
              Enter Broadcast Mock Stage
            </MechanicalButton>
          </div>
        </div>
      </div>
    </div>
  );
}
