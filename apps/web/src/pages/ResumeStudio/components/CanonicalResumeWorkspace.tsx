import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, ShieldCheck, User, Briefcase, GraduationCap, Wrench, Edit3, X, Check, ArrowRight } from "lucide-react";
import { ApiClient } from "../../../lib/api";

interface CanonicalResumeWorkspaceProps {
  resumeId: string;
}

export const CanonicalResumeWorkspace: React.FC<CanonicalResumeWorkspaceProps> = ({ resumeId }) => {
  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"personal" | "summary" | "experience" | "education" | "skills">("personal");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<any>(null);

  useEffect(() => {
    fetchResume();
  }, [resumeId]);

  const fetchResume = async () => {
    try {
      const res = await ApiClient.getResume(resumeId);
      if (res?.data) {
        setResume(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch resume:", err);
    } finally {
      setLoading(false);
    }
  };

  const getProvenanceBadge = (provenance: any) => {
    if (!provenance) return null;
    if (provenance.sourceType === "USER_CONFIRMED") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title={`Verified at ${provenance.verifiedAt}`}>
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          Verified
        </span>
      );
    }
    if (provenance.sourceType === "RESUME" || provenance.sourceType === "IMPORT") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20" title={`Parsed at ${provenance.extractedAt}`}>
          <CheckCircle2 className="w-3 h-3 text-blue-400" />
          Parsed
        </span>
      );
    }
    if (provenance.sourceType === "AI_INFERRED") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          AI Inferred
        </span>
      );
    }
    return null;
  };

  const startEditing = (fieldId: string, currentValue: any) => {
    setEditingField(fieldId);
    setEditValue(currentValue);
  };

  const saveField = async (section: string, fieldId: string) => {
    try {
      let updates: any = {};
      if (section === "personal") {
        updates = { [fieldId]: editValue };
      } else if (section === "summary") {
        updates = { summary: editValue };
      } else {
        updates = editValue; // For array items, editValue is the full object
      }
      
      const res = await ApiClient.post<any>(`/api/resume/${resumeId}/confirm`, {
        section,
        fieldId,
        updates
      });
      if (res?.resume) {
        setResume(res.resume);
      }
      setEditingField(null);
    } catch (err) {
      console.error("Failed to save field:", err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading canonical resume...</div>;
  }

  if (!resume) {
    return <div className="p-8 text-center text-rose-400">Resume not found.</div>;
  }

  const pd = resume.profileData || {};

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Canonical Resume Workspace
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              v{resume.version || 1}
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Review and confirm extracted facts. Changes are version-controlled and synchronized with your Candidate Profile.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-slate-400">Verification Status: </span>
            <span className="text-amber-400 font-medium capitalize">{resume.verificationStatus || "Unverified"}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-white/10 bg-white/[0.01] flex flex-col p-4 gap-2">
          <button
            onClick={() => setActiveTab("personal")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "personal" ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <User className="w-4 h-4" />
            Basics
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "summary" ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <ArrowRight className="w-4 h-4" />
            Summary
          </button>
          <button
            onClick={() => setActiveTab("experience")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "experience" ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Experience
          </button>
          <button
            onClick={() => setActiveTab("education")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "education" ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Education
          </button>
          <button
            onClick={() => setActiveTab("skills")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "skills" ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Wrench className="w-4 h-4" />
            Skills
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {activeTab === "personal" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
                {["fullName", "email", "phone", "location", "linkedin", "portfolio"].map((key) => (
                  <div key={key} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between group">
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{key}</p>
                      {editingField === key ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <p className="text-white text-sm">{pd.personal?.[key] || "Not provided"}</p>
                          {getProvenanceBadge(pd.personal?.provenance)}
                        </div>
                      )}
                    </div>
                    <div>
                      {editingField === key ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => saveField("personal", key)} className="p-1.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingField(null)} className="p-1.5 rounded bg-white/5 text-slate-400 hover:bg-white/10">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEditing(key, pd.personal?.[key] || "")} className="p-1.5 rounded bg-white/5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 hover:text-white">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "summary" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Professional Summary</h3>
                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex gap-4 group">
                  <div className="flex-1">
                    {editingField === "summary" ? (
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm min-h-[120px] focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <div className="space-y-3">
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{pd.summary || "No summary provided."}</p>
                        <div>{getProvenanceBadge(pd.summaryProvenance)}</div>
                      </div>
                    )}
                  </div>
                  <div>
                    {editingField === "summary" ? (
                      <div className="flex flex-col gap-2">
                        <button onClick={() => saveField("summary", "summary")} className="p-1.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingField(null)} className="p-1.5 rounded bg-white/5 text-slate-400 hover:bg-white/10">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEditing("summary", pd.summary || "")} className="p-1.5 rounded bg-white/5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 hover:text-white">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "experience" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Work Experience</h3>
                {pd.experience?.map((exp: any, i: number) => (
                  <div key={exp.id || i} className="p-5 rounded-xl border border-white/10 bg-white/[0.02] group">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-white font-medium">{exp.role}</h4>
                        <p className="text-slate-400 text-sm">{exp.company} • {exp.startDate} - {exp.endDate}</p>
                        <div className="mt-2">{getProvenanceBadge(exp.provenance)}</div>
                      </div>
                      <button className="p-1.5 rounded bg-white/5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 hover:text-white">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                    <ul className="list-disc list-outside ml-4 space-y-2 text-sm text-slate-300">
                      {exp.bullets?.map((b: string, j: number) => (
                        <li key={j}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                {(!pd.experience || pd.experience.length === 0) && (
                  <p className="text-slate-400 text-sm">No experience recorded.</p>
                )}
              </div>
            )}

            {activeTab === "education" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Education</h3>
                {pd.education?.map((edu: any, i: number) => (
                  <div key={edu.id || i} className="p-5 rounded-xl border border-white/10 bg-white/[0.02] group flex items-start justify-between">
                    <div>
                      <h4 className="text-white font-medium">{edu.degree} in {edu.field}</h4>
                      <p className="text-slate-400 text-sm">{edu.institution} • {edu.startDate} - {edu.endDate}</p>
                      <div className="mt-2">{getProvenanceBadge(edu.provenance)}</div>
                    </div>
                    <button className="p-1.5 rounded bg-white/5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 hover:text-white">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "skills" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Structured Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {pd.skills?.structured?.map((skill: any, i: number) => (
                    <div key={skill.id || i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5">
                      <span className="text-white text-sm font-medium">{skill.normalized}</span>
                      <span className="text-xs text-slate-500 capitalize">{skill.category}</span>
                      {getProvenanceBadge(skill.provenance)}
                    </div>
                  ))}
                  {(!pd.skills?.structured || pd.skills.structured.length === 0) && (
                    <p className="text-slate-400 text-sm">No structured skills found.</p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
