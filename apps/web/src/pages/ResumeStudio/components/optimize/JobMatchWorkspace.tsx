import React, { useState, useEffect } from "react";
import {
  Briefcase, CheckCircle2, AlertTriangle, ArrowRight,
  Sparkles, RefreshCw, Layers, Search, Target
} from "lucide-react";
import { ApiClient } from "../../../../lib/api";

interface JobMatchWorkspaceProps {
  resume: any;
  onNavigateToOptimizer?: (matchResult: any) => void;
}

export const JobMatchWorkspace: React.FC<JobMatchWorkspaceProps> = ({
  resume,
  onNavigateToOptimizer,
}) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [targetTitle, setTargetTitle] = useState<string>("");
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoadingJobs(true);
      try {
        const res = await ApiClient.getJobs({ limit: 50 });
        const jobList = res?.jobs || res?.data || [];
        setJobs(jobList);
      } catch (err) {
        // Fallback or empty
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    if (jobId) {
      const found = jobs.find((j) => j._id === jobId || j.id === jobId);
      if (found) {
        setJobDescription(found.description || found.snippet || "");
        setTargetTitle(found.title || "");
      }
    }
  };

  const handleRunMatch = async () => {
    if (!resume?._id) return;
    if (!jobDescription && !selectedJobId) {
      setError("Please select an existing job or paste a job description.");
      return;
    }

    setMatching(true);
    setError(null);
    try {
      const res = await ApiClient.matchJob(resume._id, {
        jobId: selectedJobId || undefined,
        jobDescription: jobDescription || undefined,
        targetTitle: targetTitle || undefined,
      });
      setMatchResult(res?.match || res?.data || res);
    } catch (err: any) {
      setError(err.message || "Failed to analyze job match. Please try again.");
    } finally {
      setMatching(false);
    }
  };

  const score = matchResult?.overallMatchScore ?? matchResult?.matchScore ?? null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-semibold text-slate-100">Job Description Match Analysis</h2>
        </div>
        <p className="text-sm text-slate-400">
          Compare your actual resume skills, experience, and terminology against a specific job posting to uncover keyword gaps.
        </p>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-sm text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-5">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Target Job Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Select Saved / Discover Job
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => handleJobSelect(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Or paste custom JD below --</option>
              {jobs.map((j) => (
                <option key={j._id || j.id} value={j._id || j.id}>
                  {j.title} {j.company ? `(${j.company})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Target Role Title
            </label>
            <input
              type="text"
              value={targetTitle}
              onChange={(e) => setTargetTitle(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Job Description Text
          </label>
          <textarea
            rows={5}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job requirements, responsibilities, and qualifications..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleRunMatch}
            disabled={matching}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${matching ? "animate-spin" : ""}`} />
            {matching ? "Matching Job Requirements..." : "Analyze Match"}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {score !== null ? (
        <div className="space-y-6">
          {/* Match Score Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-center items-center text-center">
              <div className="text-3xl font-bold text-slate-100">{score}%</div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">
                Overall Compatibility
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Skills Alignment</div>
              <div className="text-xl font-semibold text-emerald-400 mt-1">
                {matchResult?.skillsMatchScore ?? matchResult?.skillsMatch ?? "N/A"}%
              </div>
              <div className="text-xs text-slate-500 mt-1">Required tech stack coverage</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Experience Alignment</div>
              <div className="text-xl font-semibold text-blue-400 mt-1">
                {matchResult?.experienceMatchScore ?? matchResult?.experienceMatch ?? "N/A"}%
              </div>
              <div className="text-xs text-slate-500 mt-1">Years & seniority level</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Keyword Match</div>
              <div className="text-xl font-semibold text-indigo-400 mt-1">
                {matchResult?.keywordMatchScore ?? matchResult?.keywordMatch ?? "N/A"}%
              </div>
              <div className="text-xs text-slate-500 mt-1">ATS terminology presence</div>
            </div>
          </div>

          {/* Matched vs Missing Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Skills */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-sm font-semibold uppercase tracking-wider">
                  Matched Skills ({matchResult?.matchedSkills?.length || 0})
                </h3>
              </div>
              {matchResult?.matchedSkills && matchResult.matchedSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {matchResult.matchedSkills.map((skill: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-md"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No exact skill matches identified.</p>
              )}
            </div>

            {/* Missing Skills */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-sm font-semibold uppercase tracking-wider">
                  Missing Skills ({matchResult?.missingSkills?.length || 0})
                </h3>
              </div>
              {matchResult?.missingSkills && matchResult.missingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {matchResult.missingSkills.map((skill: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-md"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-400">All required skills found in your profile!</p>
              )}
            </div>
          </div>

          {/* Action to Optimize */}
          {onNavigateToOptimizer && (
            <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-semibold text-indigo-200">Optimize Resume for this Role</h4>
                <p className="text-xs text-indigo-300/80 mt-1">
                  Generate tailored bullet suggestions incorporating the missing terminology from your actual background.
                </p>
              </div>
              <button
                onClick={() => onNavigateToOptimizer(matchResult)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                Open JD Optimizer
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-10 text-center">
          <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-medium text-slate-300">No Job Match Calculated</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Select a job or paste a job description above and click "Analyze Match" to calculate real compatibility.
          </p>
        </div>
      )}
    </div>
  );
};
