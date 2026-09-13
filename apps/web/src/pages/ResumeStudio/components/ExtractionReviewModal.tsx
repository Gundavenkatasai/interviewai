import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  Award,
  ArrowRight,
  X,
  FileText,
  ShieldAlert
} from "lucide-react";

interface ExtractionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedData: any;
  fieldConfidence?: Record<string, any>;
  warnings?: string[];
  templateName?: string;
  onConfirm: (verifiedData: any) => void;
  isGenerating?: boolean;
}

export const ExtractionReviewModal: React.FC<ExtractionReviewModalProps> = ({
  isOpen,
  onClose,
  extractedData,
  fieldConfidence = {},
  warnings = [],
  templateName = "ATS Classic",
  onConfirm,
  isGenerating = false
}) => {
  if (!isOpen || !extractedData) return null;

  const [activeTab, setActiveTab] = useState<
    "personal" | "summary" | "experience" | "education" | "skills" | "projects" | "certs"
  >("personal");

  // Local editable state of canonical resume data
  const [data, setData] = useState(() => {
    const clone = JSON.parse(JSON.stringify(extractedData));
    if (!clone.personal) clone.personal = {};
    if (!clone.basics) clone.basics = {};
    if (!clone.experience) clone.experience = clone.work || [];
    if (!clone.education) clone.education = [];
    if (!clone.projects) clone.projects = [];
    if (!clone.certifications) clone.certifications = clone.certificates || [];
    if (!clone.skills) {
      clone.skills = { languages: [], frameworks: [], cloud: [], databases: [], tools: [], technical: [] };
    }
    return clone;
  });

  const getConfidenceLevel = (fieldKey: string): "high" | "medium" | "low" => {
    const val = fieldConfidence[fieldKey];
    if (!val) return "high";
    if (typeof val === "string") return val.toLowerCase() as any;
    if (val.confidence) return val.confidence.toLowerCase() as any;
    return "high";
  };

  const getConfidenceBadge = (fieldKey: string) => {
    const level = getConfidenceLevel(fieldKey);
    if (level === "low") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          Needs review
        </span>
      );
    }
    if (level === "medium") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
          Review recommended
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        Verified high
      </span>
    );
  };

  // Personal Info handlers
  const handlePersonalChange = (key: string, value: string) => {
    setData((prev: any) => ({
      ...prev,
      personal: { ...prev.personal, [key]: value },
      basics: {
        ...prev.basics,
        name: key === "fullName" ? value : prev.basics?.name,
        email: key === "email" ? value : prev.basics?.email,
        phone: key === "phone" ? value : prev.basics?.phone,
        label: key === "professionalTitle" ? value : prev.basics?.label,
        location: key === "location" ? value : prev.basics?.location
      }
    }));
  };

  // Experience handlers
  const handleExpChange = (idx: number, field: string, val: any) => {
    setData((prev: any) => {
      const expList = [...(prev.experience || [])];
      expList[idx] = { ...expList[idx], [field]: val };
      return { ...prev, experience: expList };
    });
  };

  const handleExpBulletChange = (expIdx: number, bulletIdx: number, val: string) => {
    setData((prev: any) => {
      const expList = [...(prev.experience || [])];
      const bullets = [...(expList[expIdx].bullets || [])];
      bullets[bulletIdx] = val;
      expList[expIdx] = { ...expList[expIdx], bullets };
      return { ...prev, experience: expList };
    });
  };

  const addExpBullet = (expIdx: number) => {
    setData((prev: any) => {
      const expList = [...(prev.experience || [])];
      const bullets = [...(expList[expIdx].bullets || []), ""];
      expList[expIdx] = { ...expList[expIdx], bullets };
      return { ...prev, experience: expList };
    });
  };

  const removeExpBullet = (expIdx: number, bulletIdx: number) => {
    setData((prev: any) => {
      const expList = [...(prev.experience || [])];
      const bullets = (expList[expIdx].bullets || []).filter((_: any, i: number) => i !== bulletIdx);
      expList[expIdx] = { ...expList[expIdx], bullets };
      return { ...prev, experience: expList };
    });
  };

  const addExperience = () => {
    setData((prev: any) => ({
      ...prev,
      experience: [
        {
          id: String(Date.now()),
          company: "",
          role: "",
          location: "",
          startDate: "",
          endDate: "",
          bullets: [""]
        },
        ...(prev.experience || [])
      ]
    }));
  };

  const removeExperience = (idx: number) => {
    setData((prev: any) => ({
      ...prev,
      experience: prev.experience.filter((_: any, i: number) => i !== idx)
    }));
  };

  // Education handlers
  const handleEduChange = (idx: number, field: string, val: any) => {
    setData((prev: any) => {
      const eduList = [...(prev.education || [])];
      eduList[idx] = { ...eduList[idx], [field]: val };
      return { ...prev, education: eduList };
    });
  };

  const addEducation = () => {
    setData((prev: any) => ({
      ...prev,
      education: [
        {
          id: String(Date.now()),
          institution: "",
          degree: "",
          field: "",
          endDate: "",
          gpa: ""
        },
        ...(prev.education || [])
      ]
    }));
  };

  const removeEducation = (idx: number) => {
    setData((prev: any) => ({
      ...prev,
      education: prev.education.filter((_: any, i: number) => i !== idx)
    }));
  };

  // Projects handlers
  const handleProjectChange = (idx: number, field: string, val: any) => {
    setData((prev: any) => {
      const projList = [...(prev.projects || [])];
      projList[idx] = { ...projList[idx], [field]: val };
      return { ...prev, projects: projList };
    });
  };

  const addProject = () => {
    setData((prev: any) => ({
      ...prev,
      projects: [
        {
          id: String(Date.now()),
          name: "",
          technologies: [],
          description: "",
          url: "",
          bullets: [""]
        },
        ...(prev.projects || [])
      ]
    }));
  };

  const removeProject = (idx: number) => {
    setData((prev: any) => ({
      ...prev,
      projects: prev.projects.filter((_: any, i: number) => i !== idx)
    }));
  };

  // Skills string helpers
  const getSkillsString = (key: string): string => {
    if (!data.skills) return "";
    if (Array.isArray(data.skills)) {
      return data.skills.map((s: any) => (typeof s === "string" ? s : s.name)).join(", ");
    }
    return (data.skills[key] || []).join(", ");
  };

  const setSkillsString = (key: string, str: string) => {
    const list = str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setData((prev: any) => {
      const skillsObj = typeof prev.skills === "object" && !Array.isArray(prev.skills) ? { ...prev.skills } : {};
      skillsObj[key] = list;
      return { ...prev, skills: skillsObj };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[92vh] max-h-[900px] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Review Your Extracted Resume Content
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                Step 5 of 11: Content Verification
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Template: <span className="text-slate-200 font-semibold">{templateName}</span>. Verify that names, dates, companies, and skills match your actual credentials before generating.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Warnings Alert (if any) */}
        {warnings.length > 0 && (
          <div className="mx-6 mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200">
              <span className="font-semibold">Parser Observations:</span> {warnings.join(" ")}
            </div>
          </div>
        )}

        {/* Content Tabs & Editor */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Vertical Tabs Sidebar */}
          <nav className="w-full sm:w-56 p-3 border-r border-slate-800 bg-slate-950/40 flex sm:flex-col gap-1 overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveTab("personal")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === "personal"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Personal Info</span>
              </div>
              {getConfidenceLevel("name") === "low" && <span className="w-2 h-2 rounded-full bg-amber-400" />}
            </button>

            <button
              onClick={() => setActiveTab("summary")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === "summary"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Summary</span>
              </div>
              {getConfidenceLevel("summary") === "low" && <span className="w-2 h-2 rounded-full bg-amber-400" />}
            </button>

            <button
              onClick={() => setActiveTab("experience")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === "experience"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span>Experience ({data.experience?.length || 0})</span>
              </div>
              {getConfidenceLevel("experience") === "low" && <span className="w-2 h-2 rounded-full bg-amber-400" />}
            </button>

            <button
              onClick={() => setActiveTab("education")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === "education"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                <span>Education ({data.education?.length || 0})</span>
              </div>
              {getConfidenceLevel("education") === "low" && <span className="w-2 h-2 rounded-full bg-amber-400" />}
            </button>

            <button
              onClick={() => setActiveTab("skills")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === "skills"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                <span>Skills</span>
              </div>
              {getConfidenceLevel("skills") === "low" && <span className="w-2 h-2 rounded-full bg-amber-400" />}
            </button>

            <button
              onClick={() => setActiveTab("projects")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === "projects"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4" />
                <span>Projects ({data.projects?.length || 0})</span>
              </div>
              {getConfidenceLevel("projects") === "low" && <span className="w-2 h-2 rounded-full bg-amber-400" />}
            </button>

            <button
              onClick={() => setActiveTab("certs")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === "certs"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>Certifications ({data.certifications?.length || 0})</span>
              </div>
            </button>
          </nav>

          {/* Tab Body */}
          <div className="flex-1 p-6 overflow-y-auto bg-slate-900/50">
            {/* 1. Personal Info Tab */}
            {activeTab === "personal" && (
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Personal & Contact Information
                  </h3>
                  {getConfidenceBadge("name")}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={data.personal?.fullName || data.basics?.name || ""}
                      onChange={(e) => handlePersonalChange("fullName", e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Professional Title
                    </label>
                    <input
                      type="text"
                      value={data.personal?.professionalTitle || data.basics?.label || ""}
                      onChange={(e) => handlePersonalChange("professionalTitle", e.target.value)}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={data.personal?.email || data.basics?.email || ""}
                      onChange={(e) => handlePersonalChange("email", e.target.value)}
                      placeholder="e.g. john@example.com"
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={data.personal?.phone || data.basics?.phone || ""}
                      onChange={(e) => handlePersonalChange("phone", e.target.value)}
                      placeholder="e.g. (555) 123-4567"
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Location (City, State / Country)
                    </label>
                    <input
                      type="text"
                      value={
                        data.personal?.location ||
                        (typeof data.basics?.location === "string" ? data.basics.location : data.basics?.location?.city || "")
                      }
                      onChange={(e) => handlePersonalChange("location", e.target.value)}
                      placeholder="e.g. San Francisco, CA"
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      LinkedIn URL
                    </label>
                    <input
                      type="text"
                      value={data.personal?.linkedin || ""}
                      onChange={(e) => handlePersonalChange("linkedin", e.target.value)}
                      placeholder="e.g. linkedin.com/in/johndoe"
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      GitHub Profile URL
                    </label>
                    <input
                      type="text"
                      value={data.personal?.github || ""}
                      onChange={(e) => handlePersonalChange("github", e.target.value)}
                      placeholder="e.g. github.com/johndoe"
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Summary Tab */}
            {activeTab === "summary" && (
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Professional Summary
                  </h3>
                  {getConfidenceBadge("summary")}
                </div>
                <p className="text-xs text-slate-400">
                  A concise 2-4 sentence overview of your career trajectory, core technical strengths, and quantifiable achievements.
                </p>
                <textarea
                  rows={6}
                  value={data.summary || ""}
                  onChange={(e) => setData({ ...data, summary: e.target.value })}
                  placeholder="e.g. Senior Software Engineer with 6+ years of experience designing high-throughput distributed systems in Go and Node.js..."
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* 3. Experience Tab */}
            {activeTab === "experience" && (
              <div className="space-y-5 max-w-3xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Work Experience
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ensure all company names, titles, and dates reflect your verified work history.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getConfidenceBadge("experience")}
                    <button
                      onClick={addExperience}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-semibold transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Role
                    </button>
                  </div>
                </div>

                {(!data.experience || data.experience.length === 0) && (
                  <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-xs">
                    No work experience extracted yet. Click "Add Role" to add your positions.
                  </div>
                )}

                {data.experience?.map((exp: any, expIdx: number) => (
                  <div
                    key={exp.id || expIdx}
                    className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-bold text-slate-300">
                        Position #{expIdx + 1}
                      </span>
                      <button
                        onClick={() => removeExperience(expIdx)}
                        className="text-slate-500 hover:text-rose-400 transition text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Role Title
                        </label>
                        <input
                          type="text"
                          value={exp.role || exp.position || ""}
                          onChange={(e) => handleExpChange(expIdx, "role", e.target.value)}
                          placeholder="e.g. Lead Backend Engineer"
                          className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Company / Organization
                        </label>
                        <input
                          type="text"
                          value={exp.company || exp.name || ""}
                          onChange={(e) => handleExpChange(expIdx, "company", e.target.value)}
                          placeholder="e.g. Stripe"
                          className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Start Date
                        </label>
                        <input
                          type="text"
                          value={exp.startDate || ""}
                          onChange={(e) => handleExpChange(expIdx, "startDate", e.target.value)}
                          placeholder="e.g. Jan 2021"
                          className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          End Date
                        </label>
                        <input
                          type="text"
                          value={exp.endDate || (exp.current ? "Present" : "")}
                          onChange={(e) => handleExpChange(expIdx, "endDate", e.target.value)}
                          placeholder="e.g. Present"
                          className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Bullets */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Key Bullet Points & Impact
                        </label>
                        <button
                          onClick={() => addExpBullet(expIdx)}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add Bullet
                        </button>
                      </div>

                      {(exp.bullets || []).map((bullet: string, bIdx: number) => (
                        <div key={bIdx} className="flex items-start gap-2">
                          <span className="text-slate-500 text-xs mt-1.5">•</span>
                          <textarea
                            rows={2}
                            value={bullet}
                            onChange={(e) => handleExpBulletChange(expIdx, bIdx, e.target.value)}
                            placeholder="Describe your achievement with metrics..."
                            className="flex-1 bg-slate-800/70 border border-slate-700 rounded-xl p-2 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            onClick={() => removeExpBullet(expIdx, bIdx)}
                            className="text-slate-600 hover:text-rose-400 mt-2 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. Education Tab */}
            {activeTab === "education" && (
              <div className="space-y-5 max-w-3xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Education
                  </h3>
                  <div className="flex items-center gap-2">
                    {getConfidenceBadge("education")}
                    <button
                      onClick={addEducation}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-semibold transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Degree
                    </button>
                  </div>
                </div>

                {data.education?.map((edu: any, eduIdx: number) => (
                  <div
                    key={edu.id || eduIdx}
                    className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-bold text-slate-300">
                        Degree #{eduIdx + 1}
                      </span>
                      <button
                        onClick={() => removeEducation(eduIdx)}
                        className="text-slate-500 hover:text-rose-400 transition text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Degree Title
                        </label>
                        <input
                          type="text"
                          value={edu.degree || edu.studyType || ""}
                          onChange={(e) => handleEduChange(eduIdx, "degree", e.target.value)}
                          placeholder="e.g. Bachelor of Science"
                          className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Field of Study
                        </label>
                        <input
                          type="text"
                          value={edu.field || edu.area || ""}
                          onChange={(e) => handleEduChange(eduIdx, "field", e.target.value)}
                          placeholder="e.g. Computer Science"
                          className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Institution Name
                        </label>
                        <input
                          type="text"
                          value={edu.institution || ""}
                          onChange={(e) => handleEduChange(eduIdx, "institution", e.target.value)}
                          placeholder="e.g. Stanford University"
                          className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Graduation Year / Date
                        </label>
                        <input
                          type="text"
                          value={edu.endDate || edu.year || ""}
                          onChange={(e) => handleEduChange(eduIdx, "endDate", e.target.value)}
                          placeholder="e.g. 2021"
                          className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. Skills Tab */}
            {activeTab === "skills" && (
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Categorized Skills & Tools
                  </h3>
                  {getConfidenceBadge("skills")}
                </div>
                <p className="text-xs text-slate-400">
                  Comma-separated keywords help the ATS match core competencies without stuffing.
                </p>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Programming Languages
                    </label>
                    <input
                      type="text"
                      value={getSkillsString("languages")}
                      onChange={(e) => setSkillsString("languages", e.target.value)}
                      placeholder="e.g. TypeScript, Python, Go, Java"
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Frameworks & Libraries
                    </label>
                    <input
                      type="text"
                      value={getSkillsString("frameworks")}
                      onChange={(e) => setSkillsString("frameworks", e.target.value)}
                      placeholder="e.g. React, Node.js, Fastify, Next.js"
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Cloud & Infrastructure
                    </label>
                    <input
                      type="text"
                      value={getSkillsString("cloud")}
                      onChange={(e) => setSkillsString("cloud", e.target.value)}
                      placeholder="e.g. AWS, Docker, Kubernetes, Terraform"
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Databases & Storage
                    </label>
                    <input
                      type="text"
                      value={getSkillsString("databases")}
                      onChange={(e) => setSkillsString("databases", e.target.value)}
                      placeholder="e.g. PostgreSQL, MongoDB, Redis"
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Developer Tools & Methodologies
                    </label>
                    <input
                      type="text"
                      value={getSkillsString("tools")}
                      onChange={(e) => setSkillsString("tools", e.target.value)}
                      placeholder="e.g. Git, CI/CD, Agile, Microservices"
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 6. Projects Tab */}
            {activeTab === "projects" && (
              <div className="space-y-5 max-w-3xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Key Projects
                  </h3>
                  <button
                    onClick={addProject}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-semibold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Project
                  </button>
                </div>

                {data.projects?.map((proj: any, projIdx: number) => (
                  <div
                    key={proj.id || projIdx}
                    className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-bold text-slate-300">
                        Project #{projIdx + 1}
                      </span>
                      <button
                        onClick={() => removeProject(projIdx)}
                        className="text-slate-500 hover:text-rose-400 transition text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Project Name
                        </label>
                        <input
                          type="text"
                          value={proj.name || ""}
                          onChange={(e) => handleProjectChange(projIdx, "name", e.target.value)}
                          placeholder="e.g. Distributed Task Queue"
                          className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Repository / Demo URL
                        </label>
                        <input
                          type="text"
                          value={proj.url || ""}
                          onChange={(e) => handleProjectChange(projIdx, "url", e.target.value)}
                          placeholder="e.g. github.com/username/project"
                          className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Overview Description
                      </label>
                      <textarea
                        rows={2}
                        value={proj.description || ""}
                        onChange={(e) => handleProjectChange(projIdx, "description", e.target.value)}
                        placeholder="Brief summary of the project architecture and impact..."
                        className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 7. Certifications Tab */}
            {activeTab === "certs" && (
              <div className="space-y-4 max-w-2xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Certifications & Accreditations
                </h3>
                {data.certifications?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No certifications recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {data.certifications?.map((c: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex justify-between items-center text-xs"
                      >
                        <div>
                          <span className="font-semibold text-white">{c.name}</span>
                          {c.issuer && <span className="text-slate-400"> — {c.issuer}</span>}
                        </div>
                        <span className="text-slate-500 text-[11px]">{c.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>Canonical content will be mapped into <strong>{templateName}</strong>.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>

            <button
              onClick={() => onConfirm(data)}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Resume & Scanning ATS...
                </>
              ) : (
                <>
                  Confirm & Generate ATS Resume
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
