import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  User, Briefcase, GraduationCap, Code, FileText, Upload, Plus, Trash2,
  Check, AlertTriangle, Shield, Globe, Github, Linkedin, Sliders,
  CheckCircle2, Sparkles, ExternalLink, Calendar, MapPin, Search,
  Radio, Compass, Database, KeyRound, Award, Mic, Clock, ArrowRight,
  TrendingUp, Layers, BookOpen, Building, CheckSquare, Square,
  DollarSign, Laptop, RefreshCw
} from "lucide-react";
import { useAuth } from "../contexts/AuthProvider";
import { ApiClient } from "../lib/api";
import { MechanicalButton } from "../components/ui/MechanicalButton";

// The 14 Portals supported by the 72-Hour Aggregator
const ALL_14_PORTALS = [
  // General Job Portals (7)
  { name: "LinkedIn", category: "General", desc: "Internships & off-campus tech roles" },
  { name: "Naukri", category: "General", desc: "Fresher & corporate engineering" },
  { name: "Indeed", category: "General", desc: "Wide cross-industry opportunities" },
  { name: "Foundit", category: "General", desc: "IT, services & product engineering" },
  { name: "Glassdoor", category: "General", desc: "Verified corporate & startup roles" },
  { name: "TimesJobs", category: "General", desc: "Enterprise & IT consulting roles" },
  { name: "Naukri Campus", category: "General", desc: "Campus hiring & entry-level roles" },
  // Internship Platforms (7)
  { name: "Internshala", category: "Internships", desc: "Student internships & remote roles" },
  { name: "LetsIntern", category: "Internships", desc: "Early-stage student internships" },
  { name: "Unstop", category: "Internships", desc: "Hiring challenges & hackathons" },
  { name: "AICTE Internship", category: "Internships", desc: "Govt & authorized private roles" },
  { name: "Freshersworld", category: "Internships", desc: "Entry-level & fresher pipelines" },
  { name: "Youth4work", category: "Internships", desc: "Skill-tested opportunities" },
  { name: "Foundit Zuno", category: "Internships", desc: "Student & recent graduate internships" },
];

const TECH_TRACKS = [
  "Frontend Architecture",
  "Backend & Distributed",
  "Full Stack Engineering",
  "AI & Machine Learning",
  "DevOps & Cloud Systems",
  "Data Science & Analytics",
  "Mobile Dev (iOS/Android)",
  "QA & Test Automation",
  "Product Engineering",
];

const EXPERIENCE_LEVELS = [
  "Internship / Working Student",
  "Fresher / 0-1 Year",
  "Junior / Mid (1-3 Years)",
  "Senior / Staff (3-5+ Years)",
];

const WORK_MODES = ["Remote", "Hybrid", "On-site"];

const METRO_LOCATIONS = [
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Mumbai",
  "Delhi NCR",
  "Chennai",
  "Remote PAN-India",
];

const INTERVIEW_TRACKS = [
  "System Design & Scalability",
  "Behavioral & STAR Leadership",
  "Data Structures & Algorithms",
  "Frontend Architecture & Web Vitals",
  "Backend & Database Architecture",
];

const TARGET_COMPANIES = [
  "Google",
  "Microsoft",
  "Amazon",
  "Atlassian",
  "Meta",
  "Flipkart",
  "Uber",
  "High-Growth Startups",
];

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active view tab (defaults to personal profile)
  const [activeTab, setActiveTab] = useState<
    "personal" | "jobs" | "resume" | "interview" | "stories" | "security" | "all"
  >("personal");

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Skills input helper
  const [skillInput, setSkillInput] = useState("");
  const [skillCategory, setSkillCategory] = useState("Frameworks & Web");
  const [skillLevel, setSkillLevel] = useState("Proficient");

  // Story modal / quick add state
  const [newStory, setNewStory] = useState({
    situation: "",
    task: "",
    action: "",
    result: "",
    reflection: "",
    tags: "Leadership, System Scale",
  });
  const [showStoryModal, setShowStoryModal] = useState(false);

  // Queries
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => ApiClient.getProfile(),
  });

  const { data: resumes = [], refetch: refetchResumes } = useQuery({
    queryKey: ["userResumes"],
    queryFn: () => ApiClient.getResumes(),
  });

  // Comprehensive Form State reflecting ALL website features
  const [form, setForm] = useState({
    // Personal Dossier
    personal: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      bio: "",
    },
    workAuthorization: "Indian Citizen / Authorized",
    linkedin: "",
    github: "",
    portfolio: "",

    // 72-Hour Job Intelligence Engine Columns
    headline: "Full Stack Engineer | Distributed Systems",
    monitoredPortals: [
      "LinkedIn",
      "Naukri",
      "Indeed",
      "Internshala",
      "Unstop",
      "Foundit",
      "Glassdoor",
    ] as string[],
    freshnessWindow: "72h",
    targetTechTracks: ["Frontend Architecture", "Full Stack Engineering"] as string[],
    targetExperienceLevel: "Fresher / 0-1 Year",
    targetSalaryMin: 8,
    targetSalaryMax: 24,
    preferredWorkMode: ["Remote", "Hybrid"] as string[],
    preferredLocations: ["Bengaluru", "Hyderabad", "Remote PAN-India"] as string[],

    // AI Mock Interview Studio Columns
    targetInterviewTracks: ["System Design & Scalability", "Behavioral & STAR Leadership"] as string[],
    targetCompanies: ["Google", "Microsoft", "Amazon", "High-Growth Startups"] as string[],
    readinessLevel: "Actively Interviewing",
    pacingGoalWpm: 135,

    // Behavioral Story Bank Rolodex Columns
    interviewStories: [] as Array<{
      situation: string;
      task: string;
      action: string;
      result: string;
      reflection?: string;
      tags?: string[];
    }>,

    // ATS Resume Drafting Desk Columns
    atsTargetScore: 88,
    skills: [] as Array<{ name: string; level: string; category: string }>,
    experience: [] as Array<{
      id: string;
      company: string;
      title: string;
      location?: string;
      current?: boolean;
      startDate?: string;
      endDate?: string;
      description?: string;
      bullets?: string[];
    }>,
    education: [] as Array<{
      id: string;
      institution: string;
      degree: string;
      field?: string;
      startDate?: string;
      endDate?: string;
    }>,
    projects: [] as Array<{
      id: string;
      name: string;
      description: string;
      url?: string;
      technologies?: string[];
    }>,
  });

  // Populate from DB on load
  useEffect(() => {
    if (profile) {
      setForm({
        personal: {
          fullName: profile.personal?.fullName || profile.personal?.name || user?.full_name || "",
          email: profile.personal?.email || user?.email || "",
          phone: profile.personal?.phone || "",
          location: profile.personal?.location || "",
          bio: profile.personal?.bio || "",
        },
        workAuthorization: profile.workAuthorization || "Indian Citizen / Authorized",
        linkedin: profile.linkedin || "",
        github: profile.github || "",
        portfolio: profile.portfolio || "",

        // 72-Hour Job Aggregator columns
        headline: profile.headline || "Full Stack Engineer | Distributed Systems",
        monitoredPortals:
          profile.monitoredPortals && profile.monitoredPortals.length > 0
            ? profile.monitoredPortals
            : ["LinkedIn", "Naukri", "Indeed", "Internshala", "Unstop", "Foundit", "Glassdoor"],
        freshnessWindow: profile.freshnessWindow || "72h",
        targetTechTracks:
          profile.targetTechTracks && profile.targetTechTracks.length > 0
            ? profile.targetTechTracks
            : ["Frontend Architecture", "Full Stack Engineering"],
        targetExperienceLevel: profile.targetExperienceLevel || "Fresher / 0-1 Year",
        targetSalaryMin: profile.targetSalaryMin ?? 8,
        targetSalaryMax: profile.targetSalaryMax ?? 24,
        preferredWorkMode:
          profile.preferredWorkMode && profile.preferredWorkMode.length > 0
            ? profile.preferredWorkMode
            : ["Remote", "Hybrid"],
        preferredLocations:
          profile.preferredLocations && profile.preferredLocations.length > 0
            ? profile.preferredLocations
            : ["Bengaluru", "Hyderabad", "Remote PAN-India"],

        // AI Interview Studio columns
        targetInterviewTracks:
          profile.targetInterviewTracks && profile.targetInterviewTracks.length > 0
            ? profile.targetInterviewTracks
            : ["System Design & Scalability", "Behavioral & STAR Leadership"],
        targetCompanies:
          profile.targetCompanies && profile.targetCompanies.length > 0
            ? profile.targetCompanies
            : ["Google", "Microsoft", "Amazon", "High-Growth Startups"],
        readinessLevel: profile.readinessLevel || "Actively Interviewing",
        pacingGoalWpm: profile.pacingGoalWpm ?? 135,

        // Behavioral Stories
        interviewStories: profile.interviewStories && profile.interviewStories.length > 0
          ? profile.interviewStories
          : [
              {
                situation: "High traffic spike during annual campus recruitment drive.",
                task: "Reduced API response latency from 1.2s to 180ms.",
                action: "Implemented Redis caching layer and indexed MongoDB queries.",
                result: "Zero downtime with 50,000 concurrent candidate requests.",
                reflection: "Proactive database profiling prevents production outages.",
                tags: ["System Scale", "Optimization", "Database"],
              },
            ],

        // ATS Resume & Skills
        atsTargetScore: profile.atsTargetScore ?? 88,
        skills:
          Array.isArray(profile.skills) && profile.skills.length > 0
            ? profile.skills.map((s: any) =>
                typeof s === "string"
                  ? { name: s, level: "Proficient", category: "Core" }
                  : { name: s.name, level: s.level || "Proficient", category: s.category || "General" }
              )
            : [
                { name: "TypeScript", level: "Advanced", category: "Languages" },
                { name: "React", level: "Advanced", category: "Frameworks & Web" },
                { name: "Node.js", level: "Proficient", category: "Backend" },
                { name: "MongoDB", level: "Proficient", category: "Databases" },
                { name: "System Design", level: "Advanced", category: "Architecture" },
              ],
        experience: profile.experience || [],
        education: profile.education || [],
        projects: profile.projects || [],
      });
    }
  }, [profile, user]);

  // Mutation to persist profile to MongoDB
  const updateMutation = useMutation({
    mutationFn: (data: any) => ApiClient.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    },
    onError: (err: any) => {
      alert("Failed to update profile: " + err.message);
    },
  });

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateMutation.mutate(form);
  };

  // Helper for Portal Toggle
  const togglePortal = (portalName: string) => {
    setForm((prev) => {
      const exists = prev.monitoredPortals.includes(portalName);
      return {
        ...prev,
        monitoredPortals: exists
          ? prev.monitoredPortals.filter((p) => p !== portalName)
          : [...prev.monitoredPortals, portalName],
      };
    });
  };

  const selectAllPortals = () => {
    setForm((prev) => ({
      ...prev,
      monitoredPortals: ALL_14_PORTALS.map((p) => p.name),
    }));
  };

  const selectInternshipPortalsOnly = () => {
    setForm((prev) => ({
      ...prev,
      monitoredPortals: ALL_14_PORTALS.filter((p) => p.category === "Internships").map((p) => p.name),
    }));
  };

  const selectCorporatePortalsOnly = () => {
    setForm((prev) => ({
      ...prev,
      monitoredPortals: ALL_14_PORTALS.filter((p) => p.category === "General").map((p) => p.name),
    }));
  };

  // Helper for Multi-Select Chips
  const toggleArrayItem = (key: keyof typeof form, item: string) => {
    setForm((prev: any) => {
      const currentList: string[] = prev[key] || [];
      const exists = currentList.includes(item);
      return {
        ...prev,
        [key]: exists ? currentList.filter((i: string) => i !== item) : [...currentList, item],
      };
    });
  };

  // Add Skill
  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    if (!form.skills.some((s: any) => ((typeof s === "string" ? s : s?.name) || "").toLowerCase() === skillInput.trim().toLowerCase())) {
      setForm((prev) => ({
        ...prev,
        skills: [...prev.skills, { name: skillInput.trim(), level: skillLevel, category: skillCategory }],
      }));
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (skillName: string) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s: any) => (typeof s === "string" ? s : s?.name) !== skillName),
    }));
  };

  // Add Story
  const handleAddStory = () => {
    if (!newStory.situation || !newStory.action) {
      alert("Please provide at least a Situation and Action for the STAR story.");
      return;
    }
    const tagsArray = newStory.tags.split(",").map((t) => t.trim()).filter(Boolean);
    setForm((prev) => ({
      ...prev,
      interviewStories: [
        ...prev.interviewStories,
        {
          situation: newStory.situation,
          task: newStory.task,
          action: newStory.action,
          result: newStory.result,
          reflection: newStory.reflection,
          tags: tagsArray,
        },
      ],
    }));
    setNewStory({ situation: "", task: "", action: "", result: "", reflection: "", tags: "" });
    setShowStoryModal(false);
  };

  // Resume Upload
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    try {
      await ApiClient.uploadResume(file);
      await refetchResumes();
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      alert("Resume uploaded and indexed successfully into your profile dossier!");
    } catch (err: any) {
      alert("Resume upload failed: " + err.message);
    } finally {
      setUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isGoogleUser = user?.authProvider === "google" || Boolean(user?.googleId);

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#181614] font-sans pb-20">
      {/* Editorial Navigation Top Deck */}
      <header className="bg-white border-b border-[#E5E0D4] px-4 sm:px-8 py-5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-md bg-[#172535] text-white flex items-center justify-center font-serif font-bold text-lg shadow-[0_2px_0_0_#0F1822]">
              {form.personal.fullName ? form.personal.fullName.charAt(0).toUpperCase() : "IA"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C8479]">
                  OPERATOR DOSSIER & PROFILE CALIBRATION
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#EBF3EE] text-[#2E6347] border border-[#D0E3D6]">
                  <Database className="w-3 h-3" /> MongoDB Connected
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#181614] tracking-tight flex items-center gap-2">
                <span>{form.personal.fullName || user?.full_name || "Engineering Candidate"}</span>
                {isGoogleUser && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#EBF3EE] text-[#2E6347] border border-[#D0E3D6]">
                    <CheckCircle2 className="w-3 h-3" /> Google OAuth
                  </span>
                )}
              </h1>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {saveSuccess && (
              <span className="text-xs font-semibold text-[#2E6347] flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#EBF3EE] border border-[#D0E3D6] animate-fade-in">
                <Check className="w-3.5 h-3.5" /> Persisted to MongoDB Compass!
              </span>
            )}

            <Link
              to="/jobs"
              className="px-3.5 py-2 rounded-md bg-white hover:bg-[#FAF8F5] border border-[#D5CFBF] text-[#181614] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Compass className="w-3.5 h-3.5 text-[#C84B26]" />
              <span>72h Jobs Radar</span>
            </Link>

            <Link
              to="/interview-studio"
              className="px-3.5 py-2 rounded-md bg-white hover:bg-[#FAF8F5] border border-[#D5CFBF] text-[#181614] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Mic className="w-3.5 h-3.5 text-[#172535]" />
              <span>Interview Studio</span>
            </Link>

            <MechanicalButton
              onClick={() => handleSave()}
              variant="vermilion"
              size="sm"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving to Compass..." : "Save Profile Columns"}
            </MechanicalButton>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Navigation Tabs Bar across All Website Features */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E5E0D4] scrollbar-none">
          {[
            { id: "personal", label: "Personal Profile", icon: User },
            { id: "jobs", label: "72-Hour Job Intelligence", icon: Compass, count: form.monitoredPortals.length },
            { id: "resume", label: "ATS Resume & Skills Matrix", icon: FileText, count: form.skills.length },
            { id: "interview", label: "AI Interview Studio", icon: Mic },
            { id: "stories", label: "Story Bank Rolodex (STAR)", icon: BookOpen, count: form.interviewStories.length },
            { id: "security", label: "Account & MongoDB Compass", icon: Shield },
            { id: "all", label: "All Columns (Panoramic)", icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-md text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#172535] text-white shadow-xs"
                    : "bg-white text-[#5C564E] hover:text-[#181614] hover:bg-[#FAF8F5] border border-[#E5E0D4]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isSelected ? "bg-white/20 text-white" : "bg-[#F5F3EE] text-[#5C564E]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            FEATURE COLUMN 1: PERSONAL IDENTITY & CONTACT DOSSIER (NORMAL PROFILE)
           ========================================================================= */}
        {(activeTab === "all" || activeTab === "personal") && (
          <section className="bg-white border border-[#E5E0D4] rounded-lg p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E0D4] pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#172535]">
                  <User className="w-4 h-4 text-[#C84B26]" />
                  <span>Candidate Identity & Contact Dossier</span>
                </div>
                <h2 className="text-xl font-serif font-bold text-[#181614] mt-1">
                  Personal Profile & Coordinates
                </h2>
                <p className="text-xs text-[#5C564E] mt-0.5">
                  Your primary candidate identity details, contact information, and public proof-of-work profiles.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <MechanicalButton
                  onClick={() => handleSave()}
                  variant="vermilion"
                  size="sm"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Profile"}
                </MechanicalButton>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={form.personal.fullName}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      personal: { ...prev.personal, fullName: e.target.value },
                    }))
                  }
                  placeholder="Gunda Venkatasai"
                  className="w-full px-3 py-2 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] text-xs text-[#181614] focus:outline-none focus:border-[#C84B26]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider mb-1">
                  Executive Title / Headline
                </label>
                <input
                  type="text"
                  value={form.headline}
                  onChange={(e) => setForm((prev) => ({ ...prev, headline: e.target.value }))}
                  placeholder="Full Stack Engineer | React & Distributed Systems"
                  className="w-full px-3 py-2 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] text-xs text-[#181614] focus:outline-none focus:border-[#C84B26]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider mb-1">
                  Dispatch Email Address
                </label>
                <input
                  type="email"
                  value={form.personal.email}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      personal: { ...prev.personal, email: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] text-xs text-[#181614] focus:outline-none focus:border-[#C84B26]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={form.personal.phone}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      personal: { ...prev.personal, phone: e.target.value },
                    }))
                  }
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] text-xs text-[#181614] focus:outline-none focus:border-[#C84B26]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider mb-1">
                  Current City & Metro
                </label>
                <input
                  type="text"
                  value={form.personal.location}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      personal: { ...prev.personal, location: e.target.value },
                    }))
                  }
                  placeholder="Bengaluru, Karnataka, India"
                  className="w-full px-3 py-2 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] text-xs text-[#181614] focus:outline-none focus:border-[#C84B26]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider mb-1">
                  Work Authorization Status
                </label>
                <select
                  value={form.workAuthorization}
                  onChange={(e) => setForm((prev) => ({ ...prev, workAuthorization: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] text-xs text-[#181614] focus:outline-none"
                >
                  <option value="Indian Citizen / Authorized">Indian Citizen / Authorized</option>
                  <option value="US Citizen / Green Card">US Citizen / Green Card</option>
                  <option value="H-1B / OPT Student">H-1B / OPT Student</option>
                  <option value="Requires Visa Sponsorship">Requires Visa Sponsorship</option>
                  <option value="Open to Global Relocation">Open to Global Relocation</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider mb-1">
                Candidate Bio / Elevator Pitch
              </label>
              <textarea
                rows={3}
                value={form.personal.bio}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    personal: { ...prev.personal, bio: e.target.value },
                  }))
                }
                placeholder="Software engineer specializing in high-throughput backend services and reactive user interfaces..."
                className="w-full p-3 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] text-xs text-[#181614] focus:outline-none focus:border-[#C84B26]"
              />
            </div>

            {/* Social & Code Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5" /> GitHub Profile
                </label>
                <input
                  type="text"
                  value={form.github}
                  onChange={(e) => setForm((prev) => ({ ...prev, github: e.target.value }))}
                  placeholder="https://github.com/venkat"
                  className="w-full px-3 py-2 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] text-xs text-[#181614] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Linkedin className="w-3.5 h-3.5" /> LinkedIn Profile
                </label>
                <input
                  type="text"
                  value={form.linkedin}
                  onChange={(e) => setForm((prev) => ({ ...prev, linkedin: e.target.value }))}
                  placeholder="https://linkedin.com/in/venkat"
                  className="w-full px-3 py-2 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] text-xs text-[#181614] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Portfolio Website
                </label>
                <input
                  type="text"
                  value={form.portfolio}
                  onChange={(e) => setForm((prev) => ({ ...prev, portfolio: e.target.value }))}
                  placeholder="https://venkat.dev"
                  className="w-full px-3 py-2 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] text-xs text-[#181614] focus:outline-none"
                />
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            FEATURE COLUMN 2: 72-HOUR JOB INTELLIGENCE ENGINE (14 PORTALS & VERIFICATION)
           ========================================================================= */}
        {(activeTab === "all" || activeTab === "jobs") && (
          <section className="bg-white border border-[#E5E0D4] rounded-lg p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E0D4] pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#C84B26]">
                  <Compass className="w-4 h-4" />
                  <span>Feature Column — 72-Hour Job Intelligence Aggregator</span>
                </div>
                <h2 className="text-xl font-serif font-bold text-[#181614] mt-1">
                  14-Portal Job Ingestion & Strict Cutoff Radar
                </h2>
                <p className="text-xs text-[#5C564E] mt-0.5">
                  Calibrate the automated 15-minute verification engine. Only jobs verified within your chosen freshness window appear.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/jobs"
                  className="px-3 py-1.5 rounded bg-[#C84B26] hover:bg-[#B33E1D] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>Open 72h Jobs Radar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Freshness Window & Fast Cutoffs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 p-4 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#181614] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#C84B26]" /> Freshness Cutoff
                  </span>
                  <span className="text-[10px] font-mono text-[#2E6347] bg-[#EBF3EE] px-1.5 py-0.5 rounded border border-[#D0E3D6]">
                    STRICT UTC RULE
                  </span>
                </div>
                <p className="text-[11px] text-[#5C564E]">
                  Jobs older than this cutoff are instantly culled by the backend eligibility engine.
                </p>
                <div className="space-y-2 pt-1">
                  {[
                    { id: "24h", label: "Last 24 Hours", tag: "Ultra-Fresh Only" },
                    { id: "48h", label: "Last 48 Hours", tag: "High Response Rate" },
                    { id: "72h", label: "Last 72 Hours", tag: "Platform Maximum" },
                  ].map((w) => (
                    <label
                      key={w.id}
                      className={`flex items-center justify-between p-2.5 rounded-md border text-xs cursor-pointer transition-all ${
                        form.freshnessWindow === w.id
                          ? "bg-white border-[#C84B26] text-[#C84B26] font-semibold shadow-xs"
                          : "bg-[#F5F3EE]/60 border-[#E5E0D4] text-[#5C564E] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="freshnessWindow"
                          checked={form.freshnessWindow === w.id}
                          onChange={() => setForm((prev) => ({ ...prev, freshnessWindow: w.id }))}
                          className="text-[#C84B26] focus:ring-[#C84B26]"
                        />
                        <span>{w.label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8C8479]">{w.tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Monitored Portals Matrix */}
              <div className="md:col-span-2 p-4 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#181614] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#172535]" /> Monitored Portals ({form.monitoredPortals.length}/14 Active)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={selectAllPortals}
                      className="px-2 py-0.5 rounded bg-white hover:bg-[#F5F3EE] border border-[#D5CFBF] text-[#181614]"
                    >
                      All 14
                    </button>
                    <button
                      type="button"
                      onClick={selectInternshipPortalsOnly}
                      className="px-2 py-0.5 rounded bg-white hover:bg-[#F5F3EE] border border-[#D5CFBF] text-[#181614]"
                    >
                      Internships
                    </button>
                    <button
                      type="button"
                      onClick={selectCorporatePortalsOnly}
                      className="px-2 py-0.5 rounded bg-white hover:bg-[#F5F3EE] border border-[#D5CFBF] text-[#181614]"
                    >
                      Corporate
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
                  {ALL_14_PORTALS.map((portal) => {
                    const isMonitored = form.monitoredPortals.includes(portal.name);
                    return (
                      <button
                        type="button"
                        key={portal.name}
                        onClick={() => togglePortal(portal.name)}
                        className={`p-2 rounded-md border text-left transition-all flex flex-col justify-between ${
                          isMonitored
                            ? "bg-white border-[#172535] text-[#181614] shadow-xs"
                            : "bg-[#F5F3EE]/40 border-[#E5E0D4] text-[#8C8479] opacity-75 hover:opacity-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{portal.name}</span>
                          {isMonitored ? (
                            <CheckSquare className="w-3.5 h-3.5 text-[#2E6347]" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-[#D5CFBF]" />
                          )}
                        </div>
                        <span className="text-[9px] font-mono uppercase text-[#8C8479] mt-1">
                          {portal.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Target Tech Tracks & Career Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Tech Tracks */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider">
                  Target Tech Tracks
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TECH_TRACKS.map((track) => {
                    const isSelected = form.targetTechTracks.includes(track);
                    return (
                      <button
                        type="button"
                        key={track}
                        onClick={() => toggleArrayItem("targetTechTracks", track)}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-mono transition-all ${
                          isSelected
                            ? "bg-[#172535] text-white"
                            : "bg-[#FAF8F5] text-[#5C564E] border border-[#E5E0D4] hover:bg-white"
                        }`}
                      >
                        {track}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Experience Tier & Compensation expectations */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider mb-1.5">
                    Target Experience Tier
                  </label>
                  <select
                    value={form.targetExperienceLevel}
                    onChange={(e) => setForm((prev) => ({ ...prev, targetExperienceLevel: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] text-xs text-[#181614] focus:outline-none focus:border-[#C84B26]"
                  >
                    {EXPERIENCE_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider mb-1.5">
                    Expected Salary Range (LPA)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={form.targetSalaryMin}
                      onChange={(e) => setForm((prev) => ({ ...prev, targetSalaryMin: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] text-xs font-mono text-[#181614] focus:outline-none focus:border-[#C84B26]"
                      placeholder="Min LPA"
                    />
                    <span className="text-xs text-[#8C8479]">to</span>
                    <input
                      type="number"
                      min={1}
                      max={150}
                      value={form.targetSalaryMax}
                      onChange={(e) => setForm((prev) => ({ ...prev, targetSalaryMax: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] text-xs font-mono text-[#181614] focus:outline-none focus:border-[#C84B26]"
                      placeholder="Max LPA"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Target Locations & Work Modes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider mb-1.5">
                  Target Metro Locations
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {METRO_LOCATIONS.map((loc) => {
                    const isSelected = form.preferredLocations.includes(loc);
                    return (
                      <button
                        type="button"
                        key={loc}
                        onClick={() => toggleArrayItem("preferredLocations", loc)}
                        className={`px-2.5 py-1 rounded text-xs font-mono transition-all flex items-center gap-1 ${
                          isSelected
                            ? "bg-[#C84B26] text-white"
                            : "bg-[#FAF8F5] text-[#5C564E] border border-[#E5E0D4] hover:bg-white"
                        }`}
                      >
                        <MapPin className="w-3 h-3" />
                        <span>{loc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider mb-1.5">
                  Preferred Work Modes
                </label>
                <div className="flex flex-wrap gap-2">
                  {WORK_MODES.map((mode) => {
                    const isSelected = form.preferredWorkMode.includes(mode);
                    return (
                      <button
                        type="button"
                        key={mode}
                        onClick={() => toggleArrayItem("preferredWorkMode", mode)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#2E6347] text-white"
                            : "bg-[#FAF8F5] text-[#5C564E] border border-[#E5E0D4] hover:bg-white"
                        }`}
                      >
                        <Laptop className="w-3.5 h-3.5" />
                        <span>{mode}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            FEATURE COLUMN 2: AI MOCK INTERVIEW BROADCAST STUDIO & TELEMETRY
           ========================================================================= */}
        {(activeTab === "all" || activeTab === "interview") && (
          <section className="bg-white border border-[#E5E0D4] rounded-lg p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E0D4] pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#172535]">
                  <Mic className="w-4 h-4 text-[#C84B26]" />
                  <span>Feature Column — AI Interview Broadcast Studio & Telemetry</span>
                </div>
                <h2 className="text-xl font-serif font-bold text-[#181614] mt-1">
                  Target Roles, Dream Companies & Articulation Rubrics
                </h2>
                <p className="text-xs text-[#5C564E] mt-0.5">
                  Configure the AI interviewer's rigor, voice pacing standards, and rubric difficulty during live mock sessions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/interview-studio"
                  className="px-3 py-1.5 rounded bg-[#172535] hover:bg-[#23384E] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>Launch Studio</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Interview Tracks */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider">
                  Target Interview Tracks
                </label>
                <div className="space-y-1.5">
                  {INTERVIEW_TRACKS.map((track) => {
                    const isSelected = form.targetInterviewTracks.includes(track);
                    return (
                      <button
                        type="button"
                        key={track}
                        onClick={() => toggleArrayItem("targetInterviewTracks", track)}
                        className={`w-full p-2 rounded-md border text-left text-xs font-medium transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-[#FAF8F5] border-[#172535] text-[#172535] font-semibold"
                            : "bg-white border-[#E5E0D4] text-[#5C564E] hover:bg-[#FAF8F5]"
                        }`}
                      >
                        <span>{track}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#2E6347]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Companies */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider">
                  Target Dream Companies
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TARGET_COMPANIES.map((company) => {
                    const isSelected = form.targetCompanies.includes(company);
                    return (
                      <button
                        type="button"
                        key={company}
                        onClick={() => toggleArrayItem("targetCompanies", company)}
                        className={`px-2.5 py-1 rounded text-xs font-mono transition-all flex items-center gap-1 ${
                          isSelected
                            ? "bg-[#172535] text-white"
                            : "bg-[#FAF8F5] text-[#5C564E] border border-[#E5E0D4] hover:bg-white"
                        }`}
                      >
                        <Building className="w-3 h-3" />
                        <span>{company}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Speech Telemetry & Readiness */}
              <div className="space-y-4 p-4 rounded-md bg-[#FAF8F5] border border-[#E5E0D4]">
                <div>
                  <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider mb-1">
                    Candidate Readiness Stage
                  </label>
                  <select
                    value={form.readinessLevel}
                    onChange={(e) => setForm((prev) => ({ ...prev, readinessLevel: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-white border border-[#E5E0D4] text-xs text-[#181614] focus:outline-none"
                  >
                    <option value="Early Preparation">Early Preparation (Foundations)</option>
                    <option value="Actively Interviewing">Actively Interviewing</option>
                    <option value="Final Rounds Imminent">Final Rounds Imminent</option>
                    <option value="Offer Negotiation">Offer Negotiation</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-[#181614] uppercase tracking-wider">
                      Target Speaking Pacing:
                    </span>
                    <span className="font-mono font-bold text-[#C84B26]">{form.pacingGoalWpm} WPM</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="180"
                    value={form.pacingGoalWpm}
                    onChange={(e) => setForm((prev) => ({ ...prev, pacingGoalWpm: Number(e.target.value) }))}
                    className="w-full accent-[#C84B26] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[#8C8479]">
                    <span>100 WPM (Deliberate)</span>
                    <span>135 WPM (Optimal)</span>
                    <span>180 WPM (Rapid)</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            FEATURE COLUMN 3: BEHAVIORAL STORY BANK ROLODEX (STAR METHOD)
           ========================================================================= */}
        {(activeTab === "all" || activeTab === "stories") && (
          <section className="bg-white border border-[#E5E0D4] rounded-lg p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E0D4] pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#172535]">
                  <BookOpen className="w-4 h-4 text-[#C84B26]" />
                  <span>Feature Column — Behavioral Story Bank Rolodex</span>
                </div>
                <h2 className="text-xl font-serif font-bold text-[#181614] mt-1">
                  STAR Method Rolodex ({form.interviewStories.length} Indexed Stories)
                </h2>
                <p className="text-xs text-[#5C564E] mt-0.5">
                  Pre-formulate your high-impact experiences (Situation, Task, Action, Result) for automated AI mock interview recall.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowStoryModal(true)}
                  className="px-3 py-1.5 rounded bg-[#C84B26] hover:bg-[#B33E1D] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add STAR Story</span>
                </button>
              </div>
            </div>

            {/* Stories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {form.interviewStories.map((story, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-[#E5E0D4] text-[#172535] font-semibold">
                      STAR Story #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          interviewStories: prev.interviewStories.filter((_, i) => i !== idx),
                        }))
                      }
                      className="text-[#8C8479] hover:text-[#9E2A2B] transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <p>
                      <strong className="text-[#172535] font-mono text-[11px]">S:</strong>{" "}
                      <span className="text-[#181614]">{story.situation}</span>
                    </p>
                    <p>
                      <strong className="text-[#172535] font-mono text-[11px]">T:</strong>{" "}
                      <span className="text-[#181614]">{story.task}</span>
                    </p>
                    <p>
                      <strong className="text-[#172535] font-mono text-[11px]">A:</strong>{" "}
                      <span className="text-[#181614]">{story.action}</span>
                    </p>
                    <p>
                      <strong className="text-[#2E6347] font-mono text-[11px]">R:</strong>{" "}
                      <span className="text-[#181614] font-medium">{story.result}</span>
                    </p>
                    {story.reflection && (
                      <p className="text-[11px] text-[#5C564E] italic pt-1 border-t border-[#E5E0D4]">
                        "{story.reflection}"
                      </p>
                    )}
                  </div>

                  {story.tags && story.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {story.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-[#E5E0D4] text-[#5C564E]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Inline Add Story Form / Modal */}
            {showStoryModal && (
              <div className="p-5 rounded-md bg-[#FAF8F5] border-2 border-dashed border-[#C84B26]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#172535]">
                    NEW BEHAVIORAL STAR ENTRY
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowStoryModal(false)}
                    className="text-xs text-[#8C8479] hover:underline"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-[#181614] mb-1">
                      Situation (Context & Setting)
                    </label>
                    <textarea
                      rows={2}
                      value={newStory.situation}
                      onChange={(e) => setNewStory({ ...newStory, situation: e.target.value })}
                      placeholder="e.g. During our Q3 production launch..."
                      className="w-full p-2 rounded bg-white border border-[#E5E0D4] text-xs focus:outline-none focus:border-[#C84B26]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#181614] mb-1">
                      Task (Your Objective & Responsibility)
                    </label>
                    <textarea
                      rows={2}
                      value={newStory.task}
                      onChange={(e) => setNewStory({ ...newStory, task: e.target.value })}
                      placeholder="e.g. I was responsible for diagnosing the memory leak..."
                      className="w-full p-2 rounded bg-white border border-[#E5E0D4] text-xs focus:outline-none focus:border-[#C84B26]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#181614] mb-1">
                      Action (Engineering Actions Taken)
                    </label>
                    <textarea
                      rows={2}
                      value={newStory.action}
                      onChange={(e) => setNewStory({ ...newStory, action: e.target.value })}
                      placeholder="e.g. Profiled the heap dumps with Chrome DevTools and patched..."
                      className="w-full p-2 rounded bg-white border border-[#E5E0D4] text-xs focus:outline-none focus:border-[#C84B26]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#181614] mb-1">
                      Result (Quantified Outcome & Metrics)
                    </label>
                    <textarea
                      rows={2}
                      value={newStory.result}
                      onChange={(e) => setNewStory({ ...newStory, result: e.target.value })}
                      placeholder="e.g. Reduced memory usage by 45% and prevented client crash..."
                      className="w-full p-2 rounded bg-white border border-[#E5E0D4] text-xs focus:outline-none focus:border-[#C84B26]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-mono text-[#181614] mb-1">
                      Competency Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={newStory.tags}
                      onChange={(e) => setNewStory({ ...newStory, tags: e.target.value })}
                      placeholder="Leadership, Debugging, Scale"
                      className="w-full px-2.5 py-1.5 rounded bg-white border border-[#E5E0D4] text-xs focus:outline-none"
                    />
                  </div>
                  <div className="pt-5">
                    <button
                      type="button"
                      onClick={handleAddStory}
                      className="px-4 py-2 rounded bg-[#172535] hover:bg-[#23384E] text-white text-xs font-semibold transition-colors"
                    >
                      Save STAR Story
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* =========================================================================
            FEATURE COLUMN 4: ATS RESUME DRAFTING DESK & SKILLS INVENTORY
           ========================================================================= */}
        {(activeTab === "all" || activeTab === "resume") && (
          <section className="bg-white border border-[#E5E0D4] rounded-lg p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E0D4] pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#C84B26]">
                  <FileText className="w-4 h-4" />
                  <span>Feature Column — ATS Resume Drafting Desk & Scoring</span>
                </div>
                <h2 className="text-xl font-serif font-bold text-[#181614] mt-1">
                  Skills Matrix, Executive Title & Resume Vault
                </h2>
                <p className="text-xs text-[#5C564E] mt-0.5">
                  Synchronize your technical proficiency, ATS parseable experience, and canonical PDF/DOCX drafts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/resume-studio"
                  className="px-3 py-1.5 rounded bg-[#FAF8F5] hover:bg-white border border-[#D5CFBF] text-[#181614] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C84B26]" />
                  <span>Resume Studio</span>
                </Link>
              </div>
            </div>

            {/* Headline & Target ATS Score */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider mb-1.5">
                  Executive Professional Headline
                </label>
                <input
                  type="text"
                  value={form.headline}
                  onChange={(e) => setForm((prev) => ({ ...prev, headline: e.target.value }))}
                  placeholder="Senior Full Stack Architect | React, TypeScript & Distributed Systems"
                  className="w-full px-3.5 py-2 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] text-xs text-[#181614] focus:outline-none focus:border-[#C84B26]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider mb-1.5">
                  Target ATS Passing Score
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={60}
                    max={100}
                    value={form.atsTargetScore}
                    onChange={(e) => setForm((prev) => ({ ...prev, atsTargetScore: Number(e.target.value) }))}
                    className="w-24 px-3 py-2 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] text-xs font-mono font-bold text-[#2E6347] focus:outline-none"
                  />
                  <span className="text-xs text-[#5C564E]">/ 100 on ATS scanner bench</span>
                </div>
              </div>
            </div>

            {/* Categorized Skills Inventory */}
            <div className="space-y-3 p-4 rounded-md bg-[#FAF8F5] border border-[#E5E0D4]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#181614] flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-[#172535]" /> Technical Skills Inventory ({form.skills.length} Loaded)
                </span>
              </div>

              {/* Add Skill Input */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="e.g. Docker, PyTorch, GraphQL..."
                  className="flex-1 px-3 py-1.5 rounded bg-white border border-[#E5E0D4] text-xs text-[#181614] focus:outline-none focus:border-[#C84B26]"
                />
                <select
                  value={skillCategory}
                  onChange={(e) => setSkillCategory(e.target.value)}
                  className="px-2.5 py-1.5 rounded bg-white border border-[#E5E0D4] text-xs text-[#181614] focus:outline-none"
                >
                  <option value="Languages">Languages</option>
                  <option value="Frameworks & Web">Frameworks & Web</option>
                  <option value="Backend & Cloud">Backend & Cloud</option>
                  <option value="Databases & Caching">Databases & Caching</option>
                  <option value="DevOps & Tooling">DevOps & Tooling</option>
                </select>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  className="px-2.5 py-1.5 rounded bg-white border border-[#E5E0D4] text-xs text-[#181614] focus:outline-none"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Proficient">Proficient</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Lead/Expert">Lead / Expert</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3.5 py-1.5 rounded bg-[#172535] text-white text-xs font-semibold hover:bg-[#23384E] transition-colors"
                >
                  Add Skill
                </button>
              </div>

              {/* Skills Chips */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {form.skills.map((skill: any, idx: number) => {
                  const skillName = typeof skill === "string" ? skill : skill?.name || `Skill-${idx}`;
                  const skillLevel = typeof skill === "object" ? skill.level || "Proficient" : "Proficient";
                  return (
                    <div
                      key={skillName + idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-[#E5E0D4] text-xs shadow-xs"
                    >
                      <span className="font-semibold text-[#181614]">{skillName}</span>
                      <span className="text-[10px] font-mono text-[#8C8479] bg-[#F5F3EE] px-1 rounded">
                        {skillLevel}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skillName)}
                        className="text-[#8C8479] hover:text-[#9E2A2B] ml-0.5 cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resume Documents Vault */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#181614] flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#2E6347]" /> Uploaded Resume Documents
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleResumeUpload}
                  accept=".pdf,.docx"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingResume}
                  className="px-3 py-1.5 rounded bg-[#2E6347] hover:bg-[#25523A] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingResume ? "Uploading & Parsing..." : "Upload PDF / DOCX"}</span>
                </button>
              </div>

              {resumes && resumes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {resumes.map((r: any, idx: number) => (
                    <div
                      key={r.id || idx}
                      className="p-3.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-[#C84B26]" />
                        <div>
                          <p className="text-xs font-semibold text-[#181614] truncate max-w-[180px]">
                            {r.fileName || r.title || `Resume-${idx + 1}.pdf`}
                          </p>
                          <span className="text-[10px] font-mono text-[#8C8479]">
                            Score: {r.score || 85}% • ATS Calibrated
                          </span>
                        </div>
                      </div>
                      <Link
                        to="/resume-studio"
                        className="text-xs text-[#C84B26] hover:underline font-mono"
                      >
                        Inspect →
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-md bg-[#FAF8F5] border border-dashed border-[#E5E0D4] text-center text-xs text-[#5C564E]">
                  No resume document uploaded yet. Click "Upload PDF / DOCX" to parse and index your career history automatically.
                </div>
              )}
            </div>
          </section>
        )}

        {/* =========================================================================
            FEATURE COLUMN 6: ACCOUNT SECURITY & MONGODB COMPASS PERSISTENCE
           ========================================================================= */}
        {(activeTab === "all" || activeTab === "security") && (
          <section className="bg-white border border-[#E5E0D4] rounded-lg p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E5E0D4] pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#2E6347]">
                  <Database className="w-4 h-4" />
                  <span>Feature Column — Account Security & MongoDB Compass</span>
                </div>
                <h2 className="text-xl font-serif font-bold text-[#181614] mt-1">
                  Database Linkage & Credentials Management
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Connected Identity Card */}
              <div className="p-4 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#181614] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#2E6347]" /> Connected Identity Provider
                </span>

                {isGoogleUser ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 p-2.5 rounded bg-white border border-[#D0E3D6]">
                      {/* Google G logo */}
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <div>
                        <p className="font-semibold text-[#181614]">Signed in via Google OAuth 2.0</p>
                        <p className="text-[10px] font-mono text-[#5C564E]">{user?.email}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#5C564E]">
                      Your account credentials and authentication sessions are securely authorized by Google Identity Services using Client ID:
                    </p>
                    <code className="block p-1.5 rounded bg-white border border-[#E5E0D4] text-[10px] font-mono text-[#8C8479] truncate">
                      684513696427-eo6ditdc0icb9d25quoi87qcgr4kt9to.apps.googleusercontent.com
                    </code>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 p-2.5 rounded bg-white border border-[#E5E0D4]">
                      <KeyRound className="w-4 h-4 text-[#C84B26]" />
                      <div>
                        <p className="font-semibold text-[#181614]">Standard Password Authentication</p>
                        <p className="text-[10px] font-mono text-[#5C564E]">{user?.email}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#5C564E]">
                      Signed in with local cryptographic salt & hash. You can also sign in with Google anytime using the same email address.
                    </p>
                  </div>
                )}
              </div>

              {/* MongoDB Compass Connection Status */}
              <div className="p-4 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#181614] flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#2E6347]" /> MongoDB Compass Storage
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-white border border-[#E5E0D4]">
                    <span className="font-mono text-[11px] text-[#5C564E]">Database:</span>
                    <span className="font-mono font-bold text-[#181614]">interviewai</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white border border-[#E5E0D4]">
                    <span className="font-mono text-[11px] text-[#5C564E]">Compass URI:</span>
                    <span className="font-mono text-[11px] text-[#2E6347]">mongodb://127.0.0.1:27017</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white border border-[#E5E0D4]">
                    <span className="font-mono text-[11px] text-[#5C564E]">Synced Collections:</span>
                    <span className="font-mono text-[11px] text-[#181614]">users, profiles, jobs, resumes</span>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-[#8C8479]">
                  ✅ Open MongoDB Compass anytime to inspect or query raw candidate documents.
                </p>
              </div>
            </div>

            {/* Save All Button & Danger Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E5E0D4]">
              <div className="text-xs text-[#5C564E]">
                All edits made across your profile columns are stored in the local MongoDB database.
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => logout()}
                  className="px-3.5 py-2 rounded-md bg-white hover:bg-[#FAF8F5] border border-[#D5CFBF] text-[#9E2A2B] text-xs font-semibold transition-colors"
                >
                  Sign Out Session
                </button>

                <MechanicalButton
                  onClick={() => handleSave()}
                  variant="vermilion"
                  size="md"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Persisting to MongoDB..." : "Save All Profile Columns"}
                </MechanicalButton>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
