import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, Filter, Briefcase, MapPin, DollarSign, Clock, Building2,
  Bookmark, BookmarkCheck, Star, ArrowRight, RefreshCw, ChevronDown,
  Zap, X, SlidersHorizontal, ChevronUp, IndianRupee, FileText,
  Check, Sparkles, ExternalLink
} from "lucide-react";
import { ApiClient } from "../lib/api";
import { formatRelativeTime, formatSalary, getCompanyPortalUrl } from "../lib/utils";

// ─── Filter Options ──────────────────────────────────────────────────────────

const ROLE_CATEGORIES = [
  { value: "fullstack", label: "Full Stack" },
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "mobile", label: "Mobile" },
  { value: "devops", label: "DevOps / Cloud" },
  { value: "ai", label: "AI / ML" },
  { value: "data", label: "Data" },
  { value: "security", label: "Security" },
  { value: "qa", label: "QA / Testing" },
  { value: "product", label: "Product / Design" },
];

const EXPERIENCE_RANGES = [
  { value: "fresher", label: "Fresher (0y)" },
  { value: "0-1", label: "0–1 yrs" },
  { value: "1-3", label: "1–3 yrs" },
  { value: "3-5", label: "3–5 yrs" },
  { value: "5-8", label: "5–8 yrs" },
  { value: "8+", label: "8+ yrs" },
];

const POPULAR_CITIES = [
  "All India",
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Mumbai",
  "Noida",
  "Delhi NCR",
  "Chennai",
  "Kochi",
  "Remote",
];

const ALL_INDIA_CITIES = [
  "All India",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Mumbai",
  "Delhi",
  "Delhi NCR",
  "Noida",
  "Gurugram",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Kochi",
  "Coimbatore",
  "Indore",
  "Chandigarh",
  "Visakhapatnam",
  "Thiruvananthapuram",
  "Remote",
];

const WORK_MODES = [
  { value: "remote", label: "Remote 🌐" },
  { value: "hybrid", label: "Hybrid 🏢" },
  { value: "onsite", label: "On-site 📍" },
];

const EMPLOYMENT_TYPES = [
  { value: "full-time", label: "Full Time" },
  { value: "part-time", label: "Part Time" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
];

const SENIORITY_LEVELS = [
  { value: "intern", label: "Intern" },
  { value: "fresher", label: "Fresher" },
  { value: "entry", label: "Entry Level" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "principal", label: "Principal" },
];

const SALARY_PRESETS = [
  { value: "", label: "Any Salary" },
  { value: "300000", label: "₹3L+" },
  { value: "600000", label: "₹6L+" },
  { value: "1000000", label: "₹10L+" },
  { value: "1500000", label: "₹15L+" },
  { value: "2500000", label: "₹25L+" },
  { value: "4000000", label: "₹40L+" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "match", label: "Match Score: High → Low" },
  { value: "trust", label: "Trust Score: High → Low" },
  { value: "relevant", label: "Most Relevant" },
  { value: "salary_desc", label: "Salary: High → Low" },
  { value: "salary_asc", label: "Salary: Low → High" },
];


const POPULAR_SKILLS = [
  "React", "TypeScript", "Python", "Node.js", "Java", "JavaScript",
  "AWS", "Docker", "Kubernetes", "Go", "Spring Boot", "PostgreSQL",
  "FastAPI", "Django", "Angular", "Vue.js", "MongoDB", "Redis",
  "GraphQL", "Flutter", "Machine Learning", "LLM",
];

// ─── Sub-Components ──────────────────────────────────────────────────────────

function MatchScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
    : score >= 60 ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
    : "text-slate-400 bg-slate-800 border-slate-700";
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`} title="AI Match Score">
      <Star className="w-2.5 h-2.5" />
      {score}% match
    </div>
  );
}

function TrustScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? "text-blue-400 bg-blue-500/10 border-blue-500/30"
    : score >= 50 ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
    : "text-red-400 bg-red-500/10 border-red-500/30";
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`} title="Job Trust Score">
      <Sparkles className="w-2.5 h-2.5" />
      {score}% trust
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    linkedin: "bg-blue-600/10 text-blue-400 border-blue-500/20",
    naukri: "bg-red-500/10 text-red-400 border-red-500/20",
    instahyre: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    cutshort: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    foundit: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    default: "bg-slate-800 text-slate-400 border-slate-700",
  };
  const cls = colors[source?.toLowerCase()] || colors.default;
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${cls}`}>
      {source || "India"}
    </span>
  );
}

function WorkModeBadge({ mode }: { mode?: string }) {
  if (!mode) return null;
  const m = mode.toLowerCase();
  const color = m === "remote" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : m === "hybrid" ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-slate-400 bg-slate-800 border-slate-700";
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border capitalize ${color}`}>
      {mode}
    </span>
  );
}

// ─── Job Card with Direct Application Form Button ────────────────────────────

function JobCard({
  job,
  onSave,
  onPrepare,
}: {
  job: any;
  onSave: (id: string) => void;
  onPrepare: (job: any) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(job.is_saved || false);
  const navigate = useNavigate();

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaving(true);
    try {
      if (saved) { await ApiClient.unsaveJob(job.id); setSaved(false); }
      else { await ApiClient.saveJob(job.id); setSaved(true); }
      onSave(job.id);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const displayLocation = job.location_normalized || job.location || "India";
  const expLabel = job.min_experience != null
    ? job.max_experience ? `${job.min_experience}–${job.max_experience} yrs` : `${job.min_experience}+ yrs`
    : job.seniority || job.experience_level || null;

  // Use apply_url (direct apply link) with fallback chain
  const applyUrl = job.apply_url || job.application_url || job.source_url || null;
  // Use source_posted_at (employer date) with fallback to posted_at (insertion date)
  const displayPostedAt = job.source_posted_at || job.posted_at;
  const hasReliableDate = job.posting_date_confidence === "high" || job.posting_date_confidence === "medium";

  const handleApplyClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!applyUrl) return;
    window.open(applyUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      onClick={() => navigate(`/jobs/${job.id}`)}
      className="group relative p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/80 backdrop-blur-md transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-lg shadow-black/20"
    >
      <div>
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <SourceBadge source={job.source} />
              {job.duplicate_sources?.length > 0 && job.duplicate_sources
                .filter((dup: any) => dup.source !== job.source)
                .map((dup: any, i: number) => (
                  <SourceBadge key={`${dup.source}-${i}`} source={dup.source} />
                ))}
              <WorkModeBadge mode={job.work_mode} />
              {job.match_score != null && <MatchScoreBadge score={Math.round(job.match_score)} />}
              {job.trust_score != null && <TrustScoreBadge score={Math.round(job.trust_score)} />}
              {job.freshness === "FRESH" || job.is_new ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  NEW
                </span>
              ) : job.freshness === "RECENT" ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  RECENT
                </span>
              ) : null}
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
              {job.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400">
              <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-500" />
              <span className="truncate font-medium">{job.company_name}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-400 text-xs font-bold">
            {job.company_name?.[0]?.toUpperCase() || "?"}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-3">
          {displayLocation && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-indigo-400" />
              {displayLocation}
            </span>
          )}
          {(job.salary_min || job.salary_max) && (
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <IndianRupee className="w-3 h-3" />
              {formatSalary(job.salary_min, job.salary_max, job.salary_currency || "INR")}
            </span>
          )}
          {expLabel && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {expLabel}
            </span>
          )}
          <span className="flex items-center gap-1 ml-auto text-slate-500 text-[11px]" title={hasReliableDate ? "Employer posting date" : "Approximate date"}>
            {formatRelativeTime(displayPostedAt)}
            {!hasReliableDate && <span className="text-slate-600">~</span>}
          </span>
        </div>

        {/* Skills */}
        {job.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {job.skills.slice(0, 4).map((skill: string) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded-md text-[10px] bg-slate-950 border border-slate-800 text-slate-300 font-mono"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="px-1.5 py-0.5 text-[10px] text-slate-500 font-mono">
                +{job.skills.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80 mt-2">
        {applyUrl ? (
          <button
            id={`apply-btn-${job.id}`}
            onClick={handleApplyClick}
            className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/35 cursor-pointer"
            title={`Apply on ${job.source || 'source'}`}
          >
            Apply on {job.source ? job.source.charAt(0).toUpperCase() + job.source.slice(1) : 'Site'}
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}
            className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 flex items-center justify-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
          >
            View Details
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrepare(job);
          }}
          className="py-2 px-3 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center gap-1 transition-colors cursor-pointer"
          title="Prepare AI interview"
        >
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          Prepare
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            saved
              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
              : "border-slate-800 text-slate-500 hover:text-white hover:border-slate-700"
          }`}
          title={saved ? "Unsave" : "Save job"}
        >
          {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/jobs/${job.id}`);
          }}
          className="p-2 rounded-xl border border-slate-800 text-slate-500 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
          title="View full details"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Filter Section Components ───────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
        {title}
      </label>
      {children}
    </div>
  );
}

function PillGroup({
  options,
  selected,
  onChange,
  counts,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
  counts?: Record<string, number>;
}) {
  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const active = selected.includes(opt.value);
        const count = counts?.[opt.value];
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              active
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400"
                : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-750 border border-slate-700/60"
            }`}
          >
            {active && <Check className="w-3 h-3 text-white" />}
            {opt.label}
            {count != null && (
              <span className={`text-[10px] ${active ? "text-indigo-200" : "text-slate-500"}`}>
                ({count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function SinglePillGroup({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[];
  selected: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const active = selected === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(active ? "" : opt.value)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              active
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400"
                : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-750 border border-slate-700/60"
            }`}
          >
            {active && <Check className="w-3 h-3 text-white" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SkillSearch({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = POPULAR_SKILLS.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !selected.includes(s)
  );

  const add = (skill: string) => {
    if (!selected.includes(skill)) onChange([...selected, skill]);
    setInput("");
    setShowSuggestions(false);
  };

  const remove = (skill: string) => onChange(selected.filter(s => s !== skill));

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={e => {
            if (e.key === "Enter" && input.trim()) {
              e.preventDefault();
              add(input.trim());
            }
          }}
          placeholder="Type tech stack or skill, press Enter..."
          className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-indigo-500 focus:outline-none placeholder-slate-500"
        />
        {showSuggestions && filtered.length > 0 && (
          <div className="absolute z-30 top-full mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-40 overflow-auto">
            {filtered.slice(0, 8).map(s => (
              <button
                key={s}
                type="button"
                onMouseDown={() => add(s)}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(s => (
            <span
              key={s}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs border border-indigo-500/30"
            >
              {s}
              <button
                type="button"
                onClick={() => remove(s)}
                className="hover:text-white cursor-pointer ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Active Filter Chips ──────────────────────────────────────────────────────

function ActiveFilterChips({
  filters,
  onRemove,
  onClearAll,
}: {
  filters: { key: string; label: string; value: string }[];
  onRemove: (key: string, value: string) => void;
  onClearAll: () => void;
}) {
  if (filters.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
      <span className="text-xs font-semibold text-slate-400">Active Filters:</span>
      {filters.map(f => (
        <button
          key={`${f.key}-${f.value}`}
          type="button"
          onClick={() => onRemove(f.key, f.value)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/35 hover:bg-indigo-600/35 transition-all cursor-pointer"
        >
          {f.label}
          <X className="w-3 h-3" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="px-3 py-1 rounded-full text-xs font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
      >
        Clear all ({filters.length})
      </button>
    </div>
  );
}

// ─── Main JobsPage Component ──────────────────────────────────────────────────

export default function JobsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const getParam = (key: string, def = "") => searchParams.get(key) || def;
  const getArrayParam = (key: string): string[] => {
    const v = searchParams.get(key);
    return v ? v.split(",").filter(Boolean) : [];
  };

  const [search, setSearch] = useState(getParam("search"));
  const [roleCategories, setRoleCategories] = useState<string[]>(getArrayParam("role_category"));
  const [expRange, setExpRange] = useState(getParam("experience_range"));
  const [location, setLocation] = useState(getParam("location"));
  const [workModes, setWorkModes] = useState<string[]>(getArrayParam("work_mode"));
  const [empTypes, setEmpTypes] = useState<string[]>(getArrayParam("employment_type"));
  const [seniorities, setSeniorities] = useState<string[]>(getArrayParam("seniority"));
  const [salaryMin, setSalaryMin] = useState(getParam("salary_min"));
  const [salaryMax, setSalaryMax] = useState(getParam("salary_max"));
  const [postedDays, setPostedDays] = useState(getParam("posted_days"));
  const [skills, setSkills] = useState<string[]>(getArrayParam("skills"));
  const [company, setCompany] = useState(getParam("company"));
  const [sources, setSources] = useState<string[]>(getArrayParam("sources") || getArrayParam("source"));
  const [matchScore, setMatchScore] = useState(getParam("match_score"));
  const [trustScore, setTrustScore] = useState(getParam("trust_score"));
  const [sort, setSort] = useState(getParam("sort", "newest"));
  const [page, setPage] = useState(parseInt(getParam("page", "1")) || 1);
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search
  const searchDebounce = useRef<number | undefined>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    window.clearTimeout(searchDebounce.current);
    searchDebounce.current = window.setTimeout(() => setDebouncedSearch(search), 350);
    return () => window.clearTimeout(searchDebounce.current);
  }, [search]);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on '/'
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        document.getElementById("job-search-input")?.focus();
      }
      // Close filters on Esc
      if (e.key === "Escape") {
        setShowFilters(false);
        const searchInput = document.getElementById("job-search-input");
        if (searchInput && document.activeElement === searchInput) searchInput.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Build query params
  const buildParams = useCallback(() => {
    const p: Record<string, string> = {};
    if (debouncedSearch) p.search = debouncedSearch;
    if (roleCategories.length) p.role_category = roleCategories.join(",");
    if (expRange) p.experience_range = expRange;
    if (location && location !== "All India") p.location = location;
    if (workModes.length) p.work_mode = workModes.join(",");
    if (empTypes.length) p.employment_type = empTypes.join(",");
    if (seniorities.length) p.seniority = seniorities.join(",");
    if (salaryMin) p.salary_min = salaryMin;
    if (salaryMax) p.salary_max = salaryMax;
    if (postedDays) p.posted_days = postedDays;
    if (skills.length) p.skills = skills.join(",");
    if (company) p.company = company;
    if (sources.length) {
      p.source = sources.join(",");
    }
    if (matchScore) p.match_score = matchScore;
    if (trustScore) p.trust_score = trustScore;
    if (sort && sort !== "newest") p.sort = sort;
    if (page > 1) p.page = String(page);
    p.page_size = "24";
    return p;
  }, [
    debouncedSearch, roleCategories, expRange, location, workModes,
    empTypes, seniorities, salaryMin, salaryMax, postedDays,
    skills, company, sources, matchScore, trustScore, sort, page
  ]);

  // Sync URL query string
  useEffect(() => {
    const p = buildParams();
    const newParams = new URLSearchParams(p);
    setSearchParams(newParams, { replace: true });
  }, [buildParams, setSearchParams]);

  // Query key using stringified values for guaranteed reactivity
  const queryParamsKey = JSON.stringify(buildParams());

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["jobs", queryParamsKey],
    queryFn: () => ApiClient.getJobs(buildParams() as any),
    staleTime: 30 * 1000,
  });

  const { data: filterCounts } = useQuery({
    queryKey: ["job-filter-counts"],
    queryFn: () => ApiClient.getJobFilterCounts(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: jobSourcesData } = useQuery({
    queryKey: ["job-sources"],
    queryFn: () => ApiClient.getJobSources(),
    staleTime: 10 * 60 * 1000,
  });

  const jobs: any[] = data?.jobs || [];
  const totalCount: number = data?.total || 0;
  const hasMore = data?.has_more ?? jobs.length >= 24;

  // Build active filter badges
  const activeFilters: { key: string; label: string; value: string }[] = [];
  roleCategories.forEach(v => {
    const label = ROLE_CATEGORIES.find(r => r.value === v)?.label || v;
    activeFilters.push({ key: "role_category", value: v, label: `Role: ${label}` });
  });
  if (expRange) {
    const label = EXPERIENCE_RANGES.find(r => r.value === expRange)?.label || expRange;
    activeFilters.push({ key: "experience_range", value: expRange, label: `Exp: ${label}` });
  }
  if (location && location !== "All India") {
    activeFilters.push({ key: "location", value: location, label: `City: ${location}` });
  }
  workModes.forEach(v => {
    const label = WORK_MODES.find(m => m.value === v)?.label || v;
    activeFilters.push({ key: "work_mode", value: v, label: `Mode: ${label}` });
  });
  empTypes.forEach(v => {
    const label = EMPLOYMENT_TYPES.find(e => e.value === v)?.label || v;
    activeFilters.push({ key: "employment_type", value: v, label: `Type: ${label}` });
  });
  seniorities.forEach(v => {
    activeFilters.push({ key: "seniority", value: v, label: `Seniority: ${v}` });
  });
  if (salaryMin) {
    const num = parseInt(salaryMin);
    const lpa = num < 100 ? `${num} LPA` : `${(num / 100000).toFixed(0)} LPA`;
    activeFilters.push({ key: "salary_min", value: salaryMin, label: `Min ₹${lpa}` });
  }
  if (salaryMax) {
    const num = parseInt(salaryMax);
    const lpa = num < 100 ? `${num} LPA` : `${(num / 100000).toFixed(0)} LPA`;
    activeFilters.push({ key: "salary_max", value: salaryMax, label: `Max ₹${lpa}` });
  }
  skills.forEach(v => activeFilters.push({ key: "skills", value: v, label: `Skill: ${v}` }));
  if (company) activeFilters.push({ key: "company", value: company, label: `Company: ${company}` });
  sources.forEach(v => activeFilters.push({ key: "sources", value: v, label: `Source: ${v}` }));
  if (matchScore) activeFilters.push({ key: "match_score", value: matchScore, label: `Match: ${matchScore}` });
  if (trustScore) activeFilters.push({ key: "trust_score", value: trustScore, label: `Trust: ${trustScore}` });

  const removeFilter = (key: string, value: string) => {
    if (key === "role_category") setRoleCategories(prev => prev.filter(v => v !== value));
    else if (key === "experience_range") setExpRange("");
    else if (key === "location") setLocation("");
    else if (key === "work_mode") setWorkModes(prev => prev.filter(v => v !== value));
    else if (key === "employment_type") setEmpTypes(prev => prev.filter(v => v !== value));
    else if (key === "seniority") setSeniorities(prev => prev.filter(v => v !== value));
    else if (key === "salary_min") setSalaryMin("");
    else if (key === "salary_max") setSalaryMax("");
    else if (key === "skills") setSkills(prev => prev.filter(v => v !== value));
    else if (key === "company") setCompany("");
    else if (key === "sources") setSources(prev => prev.filter(v => v !== value));
    else if (key === "match_score") setMatchScore("");
    else if (key === "trust_score") setTrustScore("");
    setPage(1);
  };

  const clearAllFilters = () => {
    setSearch(""); setDebouncedSearch("");
    setRoleCategories([]); setExpRange(""); setLocation("");
    setWorkModes([]); setEmpTypes([]); setSeniorities([]);
    setSalaryMin(""); setSalaryMax(""); setPostedDays("");
    setSkills([]); setCompany(""); setSources([]);
    setMatchScore(""); setTrustScore("");
    setSort("newest"); setPage(1);
  };

  const handlePrepare = useCallback((job: any) => {
    const params = new URLSearchParams({
      job_id: job.id,
      role: job.title || "",
      company: job.company_name || "",
      jd: job.description?.slice(0, 300) || "",
    });
    navigate(`/setup?${params.toString()}`);
  }, [navigate]);

  const handleSync = async () => {
    try {
      await ApiClient.triggerJobSync();
      setTimeout(() => refetch(), 1500);
    } catch (e) { console.error(e); }
  };

  const counts = (filterCounts as any) || {};

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>🇮🇳 Jobs in India</span>
            <span className="text-xs uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-1 rounded-full">
              {totalCount > 0 ? `${totalCount.toLocaleString()} Verified Openings` : "Exclusive India"}
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Verified Indian tech roles with instant redirect to application forms.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
          <select
            value={sort}
            onChange={e => { setSort(e.target.value); setPage(1); }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:border-indigo-500 focus:outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={handleSync}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            title="Sync latest India jobs"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin text-indigo-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Search Bar & Filter Drawer Toggle ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
          <input
            id="job-search-input"
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search roles (e.g. React, Python, Full Stack), companies, or keywords..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none transition-colors placeholder-slate-500 shadow-inner"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setPage(1); }}
              className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          id="jobs-filter-toggle"
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`px-5 py-3 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            showFilters || activeFilters.length > 0
              ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400"
              : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
          {activeFilters.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-indigo-700 text-[11px] flex items-center justify-center font-extrabold">
              {activeFilters.length}
            </span>
          )}
          {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ── Quick Filter Bar (Immediate 1-click filtering) ── */}
      <div className="space-y-2.5">
        {/* Cities Quick Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-500 font-semibold shrink-0 text-[11px] uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3 text-indigo-400" /> City:
          </span>
          {POPULAR_CITIES.map(city => {
            const isSelected = city === "All India" ? !location || location === "All India" : location === city;
            return (
              <button
                key={city}
                type="button"
                onClick={() => {
                  setLocation(city === "All India" ? "" : isSelected ? "" : city);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/30 ring-1 ring-indigo-400"
                    : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>

        {/* Roles Quick Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-500 font-semibold shrink-0 text-[11px] uppercase tracking-wider flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-emerald-400" /> Role:
          </span>
          {ROLE_CATEGORIES.slice(0, 7).map(rc => {
            const isSelected = roleCategories.includes(rc.value);
            return (
              <button
                key={rc.value}
                type="button"
                onClick={() => {
                  setRoleCategories(prev =>
                    prev.includes(rc.value) ? prev.filter(x => x !== rc.value) : [...prev, rc.value]
                  );
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/30 ring-1 ring-indigo-400"
                    : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                }`}
              >
                {rc.label}
              </button>
            );
          })}
        </div>

        {/* Work Mode & Experience Quick Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-500 font-semibold shrink-0 text-[11px] uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" /> Mode:
          </span>
          {WORK_MODES.map(wm => {
            const isSelected = workModes.includes(wm.value);
            return (
              <button
                key={wm.value}
                type="button"
                onClick={() => {
                  setWorkModes(prev =>
                    prev.includes(wm.value) ? prev.filter(x => x !== wm.value) : [...prev, wm.value]
                  );
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/30 ring-1 ring-indigo-400"
                    : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                }`}
              >
                {wm.label}
              </button>
            );
          })}

          <div className="w-px h-4 bg-slate-800 mx-1 shrink-0" />

          {EXPERIENCE_RANGES.map(er => {
            const isSelected = expRange === er.value;
            return (
              <button
                key={er.value}
                type="button"
                onClick={() => {
                  setExpRange(isSelected ? "" : er.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/30 ring-1 ring-indigo-400"
                    : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                }`}
              >
                {er.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active Filter Badges ── */}
      <ActiveFilterChips
        filters={activeFilters}
        onRemove={removeFilter}
        onClearAll={clearAllFilters}
      />

      {/* ── Expanded Full Filter Drawer / Panel ── */}
      {showFilters && (
        <div className="p-6 rounded-3xl bg-slate-900/85 border border-indigo-500/20 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Advanced Filter System</h2>
            </div>
            {activeFilters.length > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Role / Category */}
            <FilterSection title="Role / Category">
              <PillGroup
                options={ROLE_CATEGORIES}
                selected={roleCategories}
                onChange={v => { setRoleCategories(v); setPage(1); }}
                counts={counts.role_categories}
              />
            </FilterSection>

            {/* Experience */}
            <FilterSection title="Experience Level">
              <SinglePillGroup
                options={EXPERIENCE_RANGES}
                selected={expRange}
                onChange={v => { setExpRange(v); setPage(1); }}
              />
            </FilterSection>

            {/* Work Mode */}
            <FilterSection title="Work Mode">
              <PillGroup
                options={WORK_MODES}
                selected={workModes}
                onChange={v => { setWorkModes(v); setPage(1); }}
                counts={counts.work_modes}
              />
            </FilterSection>

            {/* Employment Type */}
            <FilterSection title="Employment Type">
              <PillGroup
                options={EMPLOYMENT_TYPES}
                selected={empTypes}
                onChange={v => { setEmpTypes(v); setPage(1); }}
                counts={counts.employment_types}
              />
            </FilterSection>

            {/* Location (All India Cities) */}
            <FilterSection title="Location (India City)">
              <select
                id="jobs-location-filter"
                value={location}
                onChange={e => { setLocation(e.target.value); setPage(1); }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                {ALL_INDIA_CITIES.map(c => (
                  <option key={c} value={c === "All India" ? "" : c}>{c}</option>
                ))}
              </select>
            </FilterSection>

            {/* Salary Presets & Custom */}
            <FilterSection title="Minimum Salary (INR / year)">
              <div className="space-y-2">
                <SinglePillGroup
                  options={SALARY_PRESETS}
                  selected={salaryMin}
                  onChange={v => { setSalaryMin(v); setPage(1); }}
                />
                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-xs text-slate-500 font-bold">₹</span>
                    <input
                      type="number"
                      value={salaryMin}
                      onChange={e => { setSalaryMin(e.target.value); setPage(1); }}
                      placeholder="Min (e.g. 1000000)"
                      className="w-full pl-6 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-xs text-slate-500 font-bold">₹</span>
                    <input
                      type="number"
                      value={salaryMax}
                      onChange={e => { setSalaryMax(e.target.value); setPage(1); }}
                      placeholder="Max"
                      className="w-full pl-6 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </FilterSection>

            {/* Seniority */}
            <FilterSection title="Seniority">
              <PillGroup
                options={SENIORITY_LEVELS}
                selected={seniorities}
                onChange={v => { setSeniorities(v); setPage(1); }}
                counts={counts.seniorities}
              />
            </FilterSection>

            {/* Match Score */}
            <FilterSection title="Match Score">
              <SinglePillGroup
                options={[
                  { value: "strong", label: "Strong Match (80%+)" },
                  { value: "good", label: "Good Match (60-79%)" },
                  { value: "partial", label: "Partial Match (<60%)" },
                  { value: "unknown", label: "Unknown" }
                ]}
                selected={matchScore}
                onChange={v => { setMatchScore(v); setPage(1); }}
              />
            </FilterSection>

            {/* Trust Score */}
            <FilterSection title="Trust Score">
              <SinglePillGroup
                options={[
                  { value: "high", label: "High Trust (80%+)" },
                  { value: "medium", label: "Medium Trust (50-79%)" },
                  { value: "low", label: "Low Trust (<50%)" },
                  { value: "unknown", label: "Unknown" }
                ]}
                selected={trustScore}
                onChange={v => { setTrustScore(v); setPage(1); }}
              />
            </FilterSection>

            {/* Skills & Tech Stack */}
            <FilterSection title="Required Tech Stack">
              <SkillSearch
                selected={skills}
                onChange={v => { setSkills(v); setPage(1); }}
              />
            </FilterSection>

            {/* Company Search */}
            <FilterSection title="Company Name">
              <input
                id="jobs-company-filter"
                type="text"
                value={company}
                onChange={e => { setCompany(e.target.value); setPage(1); }}
                placeholder="e.g. PhonePe, Infosys, Swiggy..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-indigo-500 focus:outline-none placeholder-slate-500"
              />
            </FilterSection>

            {/* Platform / Job Source */}
            <FilterSection title="Platform (Source)">
              <PillGroup
                options={(jobSourcesData?.sources || []).map((s: any) => ({ 
                  value: s.key?.toLowerCase() || s.name?.toLowerCase(), 
                  label: s.label || s.name 
                }))}
                selected={sources}
                onChange={v => { setSources(v); setPage(1); }}
                counts={counts.sources}
              />
            </FilterSection>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <span className="text-xs text-slate-400 font-medium">
              Showing <span className="text-white font-bold">{totalCount}</span> matching India jobs
            </span>
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Apply & Close
            </button>
          </div>
        </div>
      )}

      {/* ── Job Results Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col gap-4 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-slate-800" />
                <div className="w-8 h-8 rounded-full bg-slate-800" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-800 rounded w-1/2" />
              </div>
              <div className="flex gap-2 mt-2">
                <div className="h-6 bg-slate-800 rounded-full w-16" />
                <div className="h-6 bg-slate-800 rounded-full w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 text-center p-8 rounded-3xl bg-slate-900/40 border border-slate-800">
          <Briefcase className="w-12 h-12 text-slate-600" />
          <h3 className="text-base font-bold text-white">No Matching India Jobs Found</h3>
          <p className="text-sm text-slate-400 max-w-sm">
            {activeFilters.length > 0
              ? "Try relaxing or clearing some of your filters to see more results."
              : "Sync jobs to fetch the latest Indian tech opportunities."}
          </p>
          <div className="flex items-center gap-3 pt-2">
            {activeFilters.length > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
            <button
              type="button"
              onClick={handleSync}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/25"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync India Jobs
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 font-medium">
              Showing <span className="text-white font-bold">{jobs.length}</span> of{" "}
              <span className="text-white font-bold">{totalCount.toLocaleString()}</span> India jobs
              {activeFilters.length > 0 && ` (${activeFilters.length} filter${activeFilters.length !== 1 ? "s" : ""} applied)`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {jobs.map((job: any) => (
              <JobCard
                key={job.id}
                job={job}
                onSave={() => {}}
                onPrepare={handlePrepare}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 pt-6">
            <button
              id="jobs-prev-page"
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              ← Previous
            </button>
            <span className="text-xs text-slate-400 font-medium">
              Page {page} · {totalCount.toLocaleString()} total
            </span>
            <button
              id="jobs-next-page"
              type="button"
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
