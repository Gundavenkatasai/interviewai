import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User, Briefcase, GraduationCap, Code, FileText, Upload, Plus, Trash2,
  Check, AlertTriangle, Shield, Globe, Github, Linkedin, Sliders,
  CheckCircle2, Sparkles, ExternalLink, Calendar, MapPin
} from "lucide-react";
import { useAuth } from "../contexts/AuthProvider";
import { ApiClient } from "../lib/api";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"general" | "skills" | "experience" | "education" | "projects" | "preferences" | "resumes" | "danger">("general");
  const [skillInput, setSkillInput] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Queries
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => ApiClient.getProfile(),
  });

  const { data: intelligence } = useQuery({
    queryKey: ["intelligenceSummary"],
    queryFn: () => ApiClient.getIntelligenceSummary(),
  });

  const { data: resumes = [], refetch: refetchResumes } = useQuery({
    queryKey: ["userResumes"],
    queryFn: () => ApiClient.getResumes(),
  });

  const [form, setForm] = useState({
    personal: {
      fullName: "",
      title: "",
      email: "",
      phone: "",
      location: "",
      bio: "",
    },
    skills: [] as string[],
    experience: [] as any[],
    education: [] as any[],
    projects: [] as any[],
    preferredRoles: [] as string[],
    preferredLocations: [] as string[],
    preferredWorkMode: [] as string[],
    workAuthorization: "",
    linkedin: "",
    github: "",
    portfolio: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        personal: {
          fullName: profile.personal?.fullName || user?.full_name || "",
          title: profile.personal?.title || "Software Engineer",
          email: profile.personal?.email || user?.email || "",
          phone: profile.personal?.phone || "",
          location: profile.personal?.location || "",
          bio: profile.personal?.bio || "",
        },
        skills: profile.skills || ["TypeScript", "React", "Node.js", "System Design"],
        experience: profile.experience || [],
        education: profile.education || [],
        projects: profile.projects || [],
        preferredRoles: profile.preferredRoles || ["Software Engineer", "Full Stack Engineer"],
        preferredLocations: profile.preferredLocations || ["Remote"],
        preferredWorkMode: profile.preferredWorkMode || ["Remote", "Hybrid"],
        workAuthorization: profile.workAuthorization || "Authorized to work in US / India",
        linkedin: profile.linkedin || "",
        github: profile.github || "",
        portfolio: profile.portfolio || "",
      });
    }
  }, [profile, user]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => ApiClient.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: any) => {
      alert("Failed to update profile: " + err.message);
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    if (!skillInput.trim()) return;
    if (!form.skills.includes(skillInput.trim())) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (skill: string) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    try {
      await ApiClient.uploadResume(file);
      await refetchResumes();
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      alert("Resume uploaded successfully!");
    } catch (err: any) {
      alert("Resume upload failed: " + err.message);
    } finally {
      setUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteData = async () => {
    if (!confirm("This will permanently delete ALL your interview sessions, resumes, and profile data. Continue?")) return;
    setIsDeleting(true);
    try {
      await ApiClient.deleteAllUserData();
      setDeleted(true);
      await logout();
    } catch (err: any) {
      alert("Failed to delete data: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (deleted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Data Deleted Successfully</h2>
          <p className="text-sm text-slate-400">All your data has been permanently removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Career Profile & Settings</span>
            <span className="text-xs uppercase font-bold tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-full">
              Full Profile Hub
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your personal bio, technical skills, resume documents, work history, and job hunt preferences.
          </p>
        </div>

        {saveSuccess && (
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <Check className="w-3.5 h-3.5" /> Changes Saved!
          </span>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
        {[
          { id: "general", label: "Personal Bio", icon: User },
          { id: "intelligence", label: "Intelligence & Conflicts", icon: Sparkles },
          { id: "skills", label: "Skills & Tech", icon: Code },
          { id: "experience", label: "Experience", icon: Briefcase },
          { id: "education", label: "Education", icon: GraduationCap },
          { id: "projects", label: "Projects", icon: FileText },
          { id: "preferences", label: "Job Preferences", icon: Sliders },
          { id: "resumes", label: "Resumes & Docs", icon: Upload },
          { id: "danger", label: "Privacy / Danger", icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
                isSelected
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: General Info */}
        {activeTab === "general" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-slate-800/80 space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Personal Details & Contact</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.personal.fullName}
                  onChange={(e) => setForm({ ...form, personal: { ...form.personal, fullName: e.target.value } })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Current Job Title</label>
                <input
                  type="text"
                  value={form.personal.title}
                  onChange={(e) => setForm({ ...form, personal: { ...form.personal, title: e.target.value } })}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={form.personal.email}
                  onChange={(e) => setForm({ ...form, personal: { ...form.personal, email: e.target.value } })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={form.personal.phone}
                  onChange={(e) => setForm({ ...form, personal: { ...form.personal, phone: e.target.value } })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Location (City, Country)</label>
              <input
                type="text"
                value={form.personal.location}
                onChange={(e) => setForm({ ...form, personal: { ...form.personal, location: e.target.value } })}
                placeholder="San Francisco, CA or Bengaluru, India"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Professional Bio / Summary</label>
              <textarea
                rows={4}
                value={form.personal.bio}
                onChange={(e) => setForm({ ...form, personal: { ...form.personal, bio: e.target.value } })}
                placeholder="Highlight your years of experience, core domains, and impact."
                className="w-full p-3.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-blue-400" /> LinkedIn URL
                </label>
                <input
                  type="url"
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5" /> GitHub Profile
                </label>
                <input
                  type="url"
                  value={form.github}
                  onChange={(e) => setForm({ ...form, github: e.target.value })}
                  placeholder="https://github.com/..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" /> Portfolio Website
                </label>
                <input
                  type="url"
                  value={form.portfolio}
                  onChange={(e) => setForm({ ...form, portfolio: e.target.value })}
                  placeholder="https://yourportfolio.dev"
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 1.5: Intelligence */}
        {activeTab === "intelligence" as any && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-slate-800/80 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Career Intelligence Summary
              </h2>
              {intelligence?.healthScore !== undefined && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${intelligence.healthStatus === "STRONG" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30"}`}>
                  Profile Health: {intelligence.healthScore}/100
                </span>
              )}
            </div>
            
            {intelligence?.summary ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase">Core Strengths</h3>
                  <ul className="space-y-1">
                    {intelligence.summary.coreStrengths?.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase">Potential Gaps</h3>
                  <ul className="space-y-1">
                    {intelligence.summary.potentialGaps?.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-amber-300 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Save your profile to generate an intelligence summary.</p>
            )}

            {profile?.conflicts?.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" /> Action Required: Fact Conflicts
                </h3>
                {profile.conflicts.map((conflict: any) => (
                  <div key={conflict.id} className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-rose-300">Conflict in {conflict.field}</p>
                      <p className="text-[11px] text-slate-400">Please review and resolve the discrepancy between your sources.</p>
                    </div>
                    <button type="button" className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-600">
                      Resolve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Skills */}
        {activeTab === "skills" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-slate-800/80 space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Technical Skills & Stacks</h2>
            <p className="text-xs text-slate-400">Add the programming languages, frameworks, databases, and architectures you master.</p>

            <div className="flex flex-wrap gap-2 pt-2">
              {form.skills.map((skill, idx) => {
                const s = typeof skill === "string" ? skill : (skill as any).name;
                const isVerified = typeof skill !== "string" && (skill as any).provenance?.status === "VERIFIED";
                const isAi = typeof skill !== "string" && (skill as any).provenance?.sourceType === "AI_SUGGESTED";
                
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 text-sm font-medium text-slate-200 border border-slate-700"
                  >
                    <span>{s}</span>
                    {isVerified && <span title="Verified Fact"><CheckCircle2 className="w-3 h-3 text-emerald-400" /></span>}
                    {isAi && <span title="AI Suggested"><Sparkles className="w-3 h-3 text-indigo-400" /></span>}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                placeholder="e.g. Next.js, GraphQL, PostgreSQL..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500"
              >
                Add Skill
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Experience */}
        {activeTab === "experience" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-slate-800/80 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Work Experience</h2>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    experience: [
                      ...form.experience,
                      { role: "Software Engineer", company: "Company Name", duration: "2023 - Present", description: "" }
                    ]
                  })
                }
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Experience
              </button>
            </div>

            <div className="space-y-4">
              {form.experience.map((exp, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Role (e.g. Full Stack Engineer)"
                      value={exp.role}
                      onChange={(e) => {
                        const next = [...form.experience];
                        next[idx].role = e.target.value;
                        setForm({ ...form, experience: next });
                      }}
                      className="px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white"
                    />
                    <input
                      type="text"
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => {
                        const next = [...form.experience];
                        next[idx].company = e.target.value;
                        setForm({ ...form, experience: next });
                      }}
                      className="px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Dates (e.g. 2022 - 2024)"
                        value={exp.duration}
                        onChange={(e) => {
                          const next = [...form.experience];
                          next[idx].duration = e.target.value;
                          setForm({ ...form, experience: next });
                        }}
                        className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, experience: form.experience.filter((_, i) => i !== idx) })}
                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Key impact and technologies used..."
                    value={exp.description}
                    onChange={(e) => {
                      const next = [...form.experience];
                      next[idx].description = e.target.value;
                      setForm({ ...form, experience: next });
                    }}
                    className="w-full p-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white resize-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Education */}
        {activeTab === "education" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-slate-800/80 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Education</h2>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    education: [
                      ...form.education,
                      { degree: "B.S. in Computer Science", institution: "University Name", year: "2023" }
                    ]
                  })
                }
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Education
              </button>
            </div>

            <div className="space-y-4">
              {form.education.map((edu, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Degree"
                    value={edu.degree}
                    onChange={(e) => {
                      const next = [...form.education];
                      next[idx].degree = e.target.value;
                      setForm({ ...form, education: next });
                    }}
                    className="px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Institution"
                    value={edu.institution}
                    onChange={(e) => {
                      const next = [...form.education];
                      next[idx].institution = e.target.value;
                      setForm({ ...form, education: next });
                    }}
                    className="px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Year (e.g. 2023)"
                      value={edu.year}
                      onChange={(e) => {
                        const next = [...form.education];
                        next[idx].year = e.target.value;
                        setForm({ ...form, education: next });
                      }}
                      className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, education: form.education.filter((_, i) => i !== idx) })}
                      className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Projects */}
        {activeTab === "projects" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-slate-800/80 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Featured Projects</h2>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    projects: [
                      ...form.projects,
                      { title: "Project Name", description: "What problem it solved...", url: "" }
                    ]
                  })
                }
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </div>

            <div className="space-y-4">
              {form.projects.map((proj, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Project Title"
                      value={proj.title}
                      onChange={(e) => {
                        const next = [...form.projects];
                        next[idx].title = e.target.value;
                        setForm({ ...form, projects: next });
                      }}
                      className="px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white"
                    />
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="Live URL / GitHub (optional)"
                        value={proj.url}
                        onChange={(e) => {
                          const next = [...form.projects];
                          next[idx].url = e.target.value;
                          setForm({ ...form, projects: next });
                        }}
                        className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, projects: form.projects.filter((_, i) => i !== idx) })}
                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Project description and architecture..."
                    value={proj.description}
                    onChange={(e) => {
                      const next = [...form.projects];
                      next[idx].description = e.target.value;
                      setForm({ ...form, projects: next });
                    }}
                    className="w-full p-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white resize-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 6: Preferences */}
        {activeTab === "preferences" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-slate-800/80 space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Job Hunt & Role Preferences</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Target Roles</label>
                <input
                  type="text"
                  value={form.preferredRoles.join(", ")}
                  onChange={(e) =>
                    setForm({ ...form, preferredRoles: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
                  }
                  placeholder="Backend Engineer, Full Stack Engineer"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Target Locations</label>
                <input
                  type="text"
                  value={form.preferredLocations.join(", ")}
                  onChange={(e) =>
                    setForm({ ...form, preferredLocations: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
                  }
                  placeholder="Remote, Bengaluru, New York"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Work Authorization</label>
                <input
                  type="text"
                  value={form.workAuthorization}
                  onChange={(e) => setForm({ ...form, workAuthorization: e.target.value })}
                  placeholder="US Citizen / Green Card / Requires Sponsorship"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Resumes Manager */}
        {activeTab === "resumes" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-slate-800/80 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Uploaded Resumes & Files</h2>
                <p className="text-xs text-slate-400 mt-0.5">Upload and manage PDF/DOCX resumes for ATS keyword matching and auto-tailoring.</p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingResume}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-2 shadow-md shadow-indigo-600/20"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingResume ? "Uploading..." : "Upload New Resume"}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                onChange={handleResumeUpload}
                className="hidden"
              />
            </div>

            {/* Resumes List */}
            <div className="space-y-3">
              {resumes.length > 0 ? (
                resumes.map((resItem: any) => (
                  <div
                    key={resItem._id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{resItem.filename}</p>
                        <p className="text-[11px] text-slate-500">
                          Uploaded on {new Date(resItem.createdAt).toLocaleDateString()} • {resItem.fileType?.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {resItem.processingStatus || "Ready"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 rounded-2xl bg-slate-950 border border-dashed border-slate-800 text-center space-y-2">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">No resumes uploaded yet. Upload a resume to automatically extract skills.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 8: Danger Zone */}
        {activeTab === "danger" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-rose-500/5 border border-rose-500/20 space-y-6">
            <h2 className="text-sm font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Danger Zone: Permanent Data Deletion
            </h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">Delete All My Data</p>
                <p className="text-xs text-slate-400 mt-1">
                  Permanently erase all interview sessions, scores, resume files, and applications. This cannot be recovered.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDeleteData}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? "Deleting..." : "Delete All Data"}
              </button>
            </div>
          </div>
        )}

        {/* Save Bar */}
        {activeTab !== "danger" && (
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/20"
            >
              {updateMutation.isPending ? "Saving..." : "Save Profile Changes"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
