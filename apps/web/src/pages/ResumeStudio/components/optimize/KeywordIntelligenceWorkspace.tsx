import React, { useState, useEffect } from "react";
import {
  Sparkles, CheckCircle2, AlertTriangle, Layers,
  RefreshCw, Search, Hash, TrendingUp
} from "lucide-react";
import { ApiClient } from "../../../../lib/api";

interface KeywordIntelligenceWorkspaceProps {
  resume: any;
  onAddSkill?: (skillName: string) => void;
}

export const KeywordIntelligenceWorkspace: React.FC<KeywordIntelligenceWorkspaceProps> = ({
  resume,
  onAddSkill,
}) => {
  const [targetRole, setTargetRole] = useState<string>(resume?.targetRole || "Software Engineer");
  const [loading, setLoading] = useState(false);
  const [marketKeywords, setMarketKeywords] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchKeywords = async (role: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.getMarketKeywords(role);
      setMarketKeywords(res);
    } catch (err: any) {
      setError(err.message || "Failed to load keyword intelligence.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeywords(targetRole);
  }, []);

  // Extract all existing skills from the resume profileData
  const existingSkills: string[] = [];
  const skillsData = resume?.profileData?.skills || resume?.skills;
  if (Array.isArray(skillsData)) {
    skillsData.forEach((s) => {
      if (typeof s === "string") existingSkills.push(s.toLowerCase());
      else if (s?.name) existingSkills.push(s.name.toLowerCase());
    });
  } else if (skillsData && typeof skillsData === "object") {
    Object.values(skillsData).forEach((val: any) => {
      if (Array.isArray(val)) {
        val.forEach((item) => {
          if (typeof item === "string") existingSkills.push(item.toLowerCase());
          else if (item?.name) existingSkills.push(item.name.toLowerCase());
        });
      }
    });
  }

  // Find keywords present vs missing
  const highPriority = marketKeywords?.highPriority || marketKeywords?.coreSkills || [];
  const mediumPriority = marketKeywords?.mediumPriority || marketKeywords?.tools || [];
  const domainTerms = marketKeywords?.domainTerms || marketKeywords?.concepts || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-semibold text-slate-100">Keyword Intelligence</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Benchmark your resume's technical terminology against current industry hiring standards for your target role.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Full Stack Engineer"
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => fetchKeywords(targetRole)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-sm text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Detected in Resume</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{existingSkills.length}</div>
          <div className="text-xs text-slate-500 mt-1">Total indexed skills & tools</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">High Priority Match</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {highPriority.filter((k: string) => existingSkills.includes(k.toLowerCase())).length} / {highPriority.length || 1}
          </div>
          <div className="text-xs text-slate-500 mt-1">Core role requirements covered</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Keyword Coverage</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">
            {highPriority.length > 0
              ? Math.round(
                  (highPriority.filter((k: string) => existingSkills.includes(k.toLowerCase())).length /
                    highPriority.length) *
                    100
                )
              : 0}
            %
          </div>
          <div className="text-xs text-slate-500 mt-1">Industry benchmark index</div>
        </div>
      </div>

      {/* Keywords Breakdown */}
      <div className="space-y-6">
        {/* High Priority */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                High Priority Role Keywords
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Expected core competencies for {targetRole}. Green badges are confirmed in your resume.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {highPriority.map((keyword: string, idx: number) => {
              const isPresent = existingSkills.includes(keyword.toLowerCase());
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    isPresent
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  {isPresent ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  )}
                  <span>{keyword}</span>
                  {!isPresent && onAddSkill && (
                    <button
                      onClick={() => onAddSkill(keyword)}
                      className="ml-1 text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                      title="Add to skills"
                    >
                      +
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Medium Priority */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-2">
            Secondary Tools & Technologies
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Complementary libraries, frameworks, and deployment workflows commonly sought in this domain.
          </p>

          <div className="flex flex-wrap gap-2">
            {mediumPriority.map((keyword: string, idx: number) => {
              const isPresent = existingSkills.includes(keyword.toLowerCase());
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    isPresent
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  {isPresent && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{keyword}</span>
                  {!isPresent && onAddSkill && (
                    <button
                      onClick={() => onAddSkill(keyword)}
                      className="ml-1 text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                      title="Add to skills"
                    >
                      +
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Domain Concepts */}
        {domainTerms.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-2">
              Domain Terminology & Concepts
            </h3>
            <div className="flex flex-wrap gap-2">
              {domainTerms.map((term: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-md"
                >
                  {term}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
