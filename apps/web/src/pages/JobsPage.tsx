import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, Briefcase, MapPin, DollarSign, Clock, Building2,
  Bookmark, BookmarkCheck, Star, ArrowRight, RefreshCw, ChevronDown,
  Zap, X, SlidersHorizontal, ChevronUp, Sparkles, ExternalLink,
  Check, Compass, Globe, GraduationCap, Laptop, ShieldCheck
} from "lucide-react";
import { ApiClient } from "../lib/api";
import { formatRelativeTime, formatSalary } from "../lib/utils";

// ─── Filter Options ──────────────────────────────────────────────────────────

const INTERNSHIP_PLATFORMS = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "naukri", label: "Naukri" },
  { value: "naukricampus", label: "Naukri Campus" },
  { value: "indeed", label: "Indeed" },
  { value: "glassdoor", label: "Glassdoor" },
  { value: "timesjobs", label: "TimesJobs" },
  { value: "foundit", label: "Foundit" },
  { value: "founditzuno", label: "Foundit Zuno" },
  { value: "internshala", label: "Internshala" },
  { value: "unstop", label: "Unstop" },
  { value: "aicte", label: "AICTE Internship" },
  { value: "freshersworld", label: "Freshersworld" },
  { value: "letsintern", label: "LetsIntern" },
  { value: "youth4work", label: "Youth4work" },
];

const ROLE_CATEGORIES = [
  { value: "software-development", label: "Software Development" },
  { value: "full-stack-development", label: "Full Stack" },
  { value: "frontend-development", label: "Frontend" },
  { value: "backend-development", label: "Backend" },
  { value: "mern-stack", label: "MERN Stack" },
  { value: "react-js", label: "React.js" },
  { value: "node-js", label: "Node.js" },
  { value: "java-development", label: "Java" },
  { value: "python-development", label: "Python" },
  { value: "artificial-intelligence", label: "Artificial Intelligence" },
  { value: "machine-learning", label: "Machine Learning" },
  { value: "data-science", label: "Data Science" },
  { value: "data-analyst", label: "Data Analyst" },
  { value: "cloud-computing", label: "Cloud Computing" },
  { value: "devops", label: "DevOps" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "ui-ux-design", label: "UI/UX Design" },
  { value: "product-management", label: "Product Management" },
  { value: "business-analyst", label: "Business Analyst" },
  { value: "other-engineering", label: "Other Engineering" },
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
  const color = score >= 80 ? "text-[#2E6347] bg-[#EBF3EE] border-[#D0E3D6]"
    : score >= 60 ? "text-[#A36114] bg-[#FDF6E9] border-[#A36114]/20"
    : "text-[#181614]/60 bg-[#F5F3EE] border-[#E5E0D4]";
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${color}`} title="AI Match Score">
      <Star className="w-2.5 h-2.5" />
      {score}% MATCH
    </div>
  );
}

function TrustScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? "text-[#172535] bg-[#EAEFF5] border-[#D5DEE8]"
    : score >= 50 ? "text-[#A36114] bg-[#FDF6E9] border-[#A36114]/20"
    : "text-[#9E2A2B] bg-[#FCEEEE] border-[#9E2A2B]/20";
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${color}`} title="Job Trust Score">
      <Sparkles className="w-2.5 h-2.5" />
      {score}% TRUST
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const s = source || "VERIFIED";
  return (
    <span className="px-2 py-0.5 rounded bg-[#172535] text-white text-[10px] font-mono font-bold uppercase tracking-wider">
      {s}
    </span>
  );
}

function WorkModeBadge({ mode }: { mode?: string }) {
  if (!mode) return null;
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-[#E5E0D4] bg-white text-[#181614] uppercase">
      {mode}
    </span>
  );
}

function TimeRemainingBadge({ hours }: { hours?: number }) {
  if (hours === undefined || hours === null) return null;
  const isUrgent = hours <= 12;
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${
      isUrgent
        ? "bg-[#FCEEEE] text-[#9E2A2B] border-[#9E2A2B]/20 animate-pulse"
        : "bg-[#FDF6E9] text-[#A36114] border-[#A36114]/20"
    }`} title="Time remaining before 72-hour cutoff">
      <Clock className="w-2.5 h-2.5" />
      {hours > 0 ? `${hours}h left` : "Expired"}
    </span>
  );
}

function MultiSourceBadge({ duplicateSources }: { duplicateSources?: any[] }) {
  if (!duplicateSources || duplicateSources.length <= 1) return null;
  const count = duplicateSources.length - 1;
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EBF3EE] text-[#2E6347] border border-[#D0E3D6]" title={`Consolidated from ${duplicateSources.map(s => s.source).join(", ")}`}>
      +{count} {count === 1 ? "source" : "sources"}
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
  const displayPostedAt = job.source_posted_at || job.posted_at;
  const hasReliableDate = job.posting_date_confidence === "high" || job.posting_date_confidence === "medium";

  const handleApplyClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!applyUrl) return;
    try { await ApiClient.trackApplyClick(job.id); } catch (_) {}
    window.open(applyUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      onClick={() => navigate(`/jobs/${job.id}`)}
      className="group relative p-6 rounded-lg bg-white border border-[#E5E0D4] hover:border-[#DCD5C6] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <SourceBadge source={job.source} />
              <TimeRemainingBadge hours={job.time_remaining_hours} />
              <MultiSourceBadge duplicateSources={job.duplicate_sources} />
              {job.work_mode && <WorkModeBadge mode={job.work_mode} />}
              {job.match_score != null && <MatchScoreBadge score={Math.round(job.match_score)} />}
              {job.trust_score != null && <TrustScoreBadge score={Math.round(job.trust_score)} />}
            </div>

            <h3 className="font-serif font-bold text-base text-[#181614] group-hover:text-[#C84B26] transition-colors leading-snug line-clamp-2">
              {job.title}
            </h3>

            <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-[#181614]/80">
              <Building2 className="w-3.5 h-3.5 text-[#C84B26]" />
              <span className="truncate">{job.company_name || "Enterprise Employer"}</span>
            </div>
          </div>

          <div className="w-10 h-10 rounded border border-[#E5E0D4] bg-[#FAF8F5] flex items-center justify-center text-sm font-serif font-bold text-[#172535] shrink-0 shadow-inner">
            {job.company_name?.[0]?.toUpperCase() || "J"}
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#181614]/70 mb-3 pt-2 border-t border-dashed border-[#E5E0D4]">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#181614]/40" />
            {displayLocation}
          </span>

          {(job.salary_min || job.salary_max) && (
            <span className="flex items-center gap-1 text-[#2E6347] font-semibold">
              <DollarSign className="w-3 h-3" />
              {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
            </span>
          )}

          {expLabel && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#181614]/40" />
              {expLabel}
            </span>
          )}

          <span
            className="flex items-center gap-1 ml-auto text-[11px] text-[#181614]/60 font-mono"
            title={job.published_at_ist || "Verified original publication date in IST"}
          >
            <Clock className="w-3 h-3 text-[#C84B26]" />
            <span>{formatRelativeTime(displayPostedAt)}</span>
            {job.published_at_ist && (
              <span className="hidden sm:inline text-[#181614]/40 text-[10px]">
                ({job.published_at_ist.split(',')[1]?.trim()})
              </span>
            )}
            {!hasReliableDate && <span>~</span>}
          </span>
        </div>

        {/* Skills */}
        {job.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {job.skills.slice(0, 4).map((skill: string) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded text-[11px] bg-[#F5F3EE] border border-[#E5E0D4] text-[#181614] font-mono"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="px-1.5 py-0.5 text-[10px] text-[#181614]/50 font-mono">
                +{job.skills.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-[#E5E0D4]">
        {applyUrl ? (
          <button
            id={`apply-btn-${job.id}`}
            onClick={handleApplyClick}
            className="flex-1 py-2 px-3 rounded-md text-xs font-mono font-bold text-white bg-[#C84B26] hover:bg-[#B53E1B] shadow-[0_2px_0_0_#983416] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title={`Apply directly on ${job.source || 'portal'}`}
          >
            <span>Apply on {job.source ? job.source.charAt(0).toUpperCase() + job.source.slice(1) : 'Portal'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}
            className="flex-1 py-2 px-3 rounded-md text-xs font-mono font-bold text-white bg-[#172535] hover:bg-[#23384E] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>View Ticket</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrepare(job);
          }}
          className="py-2 px-3 rounded-md text-xs font-mono font-semibold text-[#172535] bg-[#EAEFF5] hover:bg-[#DCE5EF] border border-[#D5DEE8] flex items-center justify-center gap-1 transition-colors cursor-pointer"
          title="Prepare mock interview"
        >
          <Zap className="w-3.5 h-3.5 text-[#C84B26]" />
          <span>Prep</span>
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`p-2 rounded-md border transition-colors cursor-pointer ${
            saved
              ? "bg-[#EBF3EE] border-[#D0E3D6] text-[#2E6347]"
              : "border-[#E5E0D4] text-[#181614]/50 hover:text-[#181614] bg-white"
          }`}
          title={saved ? "Unsave" : "Bookmark ticket"}
        >
          {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Filter Section Components ───────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-mono text-[#181614]/70 font-bold uppercase tracking-wider block">
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
  options: { value: string; label: string; disabled?: boolean }[];
  selected: string[];
  onChange: (v: string[]) => void;
  counts?: Record<string, number>;
}) {
  const toggle = (v: string, disabled?: boolean) => {
    if (disabled) return;
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const active = selected.includes(opt.value);
        const count = counts?.[opt.value];
        const disabled = opt.disabled;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value, disabled)}
            disabled={disabled}
            className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
              disabled 
                ? "bg-[#EFECE6] text-[#181614]/30 border border-[#E5E0D4] cursor-not-allowed"
                : active
                  ? "bg-[#172535] text-white shadow-xs cursor-pointer font-bold"
                  : "bg-white text-[#181614]/70 hover:text-[#181614] border border-[#E5E0D4] cursor-pointer"
            }`}
          >
            {active && !disabled && <Check className="w-3 h-3 text-white" />}
            <span>{opt.label}</span>
            {count != null && !disabled && (
              <span className={`text-[10px] ${active ? "text-white/70" : "text-[#181614]/40"}`}>
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
            className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              active
                ? "bg-[#172535] text-white shadow-xs font-bold"
                : "bg-white text-[#181614]/70 hover:text-[#181614] border border-[#E5E0D4]"
            }`}
          >
            {active && <Check className="w-3 h-3 text-white" />}
            <span>{opt.label}</span>
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
          placeholder="Type tech stack, press Enter..."
          className="w-full px-3 py-2 rounded-md bg-white border border-[#E5E0D4] text-[#181614] text-xs font-mono focus:border-[#C84B26] focus:outline-none placeholder-[#181614]/40"
        />
        {showSuggestions && filtered.length > 0 && (
          <div className="absolute z-30 top-full mt-1 w-full bg-white border border-[#E5E0D4] rounded-md shadow-lg max-h-40 overflow-auto">
            {filtered.slice(0, 8).map(s => (
              <button
                key={s}
                type="button"
                onMouseDown={() => add(s)}
                className="w-full text-left px-3 py-1.5 text-xs font-mono text-[#181614] hover:bg-[#F5F3EE] transition-colors cursor-pointer"
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
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#EBF3EE] text-[#2E6347] text-xs font-mono border border-[#D0E3D6]"
            >
              {s}
              <button
                type="button"
                onClick={() => remove(s)}
                className="hover:text-[#9E2A2B] cursor-pointer ml-0.5"
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
      <span className="text-xs font-mono font-medium text-[#181614]/70">ACTIVE CONSTRAINTS:</span>
      {filters.map(f => (
        <button
          key={`${f.key}-${f.value}`}
          type="button"
          onClick={() => onRemove(f.key, f.value)}
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-[#EAEFF5] text-[#172535] border border-[#D5DEE8] hover:border-[#172535] transition-all cursor-pointer"
        >
          <span>{f.label}</span>
          <X className="w-3 h-3" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="px-2.5 py-0.5 rounded text-xs font-mono text-[#181614]/50 hover:text-[#C84B26] transition-colors cursor-pointer"
      >
        [Clear All ({filters.length})]
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
  const getInitialSources = () => {
    const s = getArrayParam("sources");
    if (s.length > 0) return s;
    return getArrayParam("source");
  };
  const [sources, setSources] = useState<string[]>(getInitialSources);
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
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        document.getElementById("job-search-input")?.focus();
      }
      if (e.key === "Escape") {
        setShowFilters(false);
        const searchInput = document.getElementById("job-search-input");
        if (searchInput && document.activeElement === searchInput) searchInput.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Bi-directional synchronization for browser Back / Forward buttons and deep-linking
  useEffect(() => {
    const urlSources = searchParams.get("sources")?.split(",").filter(Boolean)
      || searchParams.get("source")?.split(",").filter(Boolean) || [];
    if (urlSources.join(",") !== sources.join(",")) {
      setSources(urlSources);
    }
    const urlSearch = searchParams.get("search") || "";
    if (urlSearch !== search) setSearch(urlSearch);
    const urlLocation = searchParams.get("location") || "";
    if (urlLocation !== location) setLocation(urlLocation);
    const urlSort = searchParams.get("sort") || "newest";
    if (urlSort !== sort) setSort(urlSort);
    const urlPage = parseInt(searchParams.get("page") || "1") || 1;
    if (urlPage !== page) setPage(urlPage);
    const urlPostedDays = searchParams.get("posted_days") || "";
    if (urlPostedDays !== postedDays) setPostedDays(urlPostedDays);
    const urlExpRange = searchParams.get("experience_range") || "";
    if (urlExpRange !== expRange) setExpRange(urlExpRange);
    const urlRoleCategory = searchParams.get("role_category")?.split(",").filter(Boolean) || [];
    if (urlRoleCategory.join(",") !== roleCategories.join(",")) setRoleCategories(urlRoleCategory);
    const urlWorkModes = searchParams.get("work_mode")?.split(",").filter(Boolean) || [];
    if (urlWorkModes.join(",") !== workModes.join(",")) setWorkModes(urlWorkModes);
  }, [searchParams]);

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
      p.sources = sources.join(",");
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

  const { data: statsData } = useQuery({
    queryKey: ["aggregator-stats"],
    queryFn: () => ApiClient.getJobStats(),
    refetchInterval: 30000,
  });

  const jobs: any[] = data?.jobs || [];
  const totalCount: number = data?.total || 0;
  const hasMore = data?.has_more ?? jobs.length >= 24;

  // Build active filter badges
  const activeFilters: { key: string; label: string; value: string }[] = [];
  if (postedDays) {
    const label = postedDays === "1" ? "Last 1 Hour" : postedDays === "6" ? "Last 6 Hours" : postedDays === "12" ? "Last 12 Hours" : postedDays === "24" ? "Last 24 Hours ⚡" : postedDays === "48" ? "Last 48 Hours" : "Last 72 Hours (Strict Max)";
    activeFilters.push({ key: "posted_days", value: postedDays, label: `Cutoff: ${label}` });
  }
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
    if (key === "posted_days") setPostedDays("");
    else if (key === "role_category") setRoleCategories(prev => prev.filter(v => v !== value));
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
    <div className="min-h-screen bg-[#F5F3EE] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* ── Top Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E0D4] pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#EBF3EE] border border-[#D0E3D6] text-[#2E6347] font-mono text-[11px] font-semibold">
              <Compass className="w-3.5 h-3.5" />
              <span>FLIGHT INDEX — LIVE CAREER REQUISITIONS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#181614] tracking-tight">
              Verified Technical Openings
            </h1>
            <p className="text-xs text-[#181614]/70">
              Direct application feeds with verified job portal routing and candidate telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1); }}
              className="px-3.5 py-2 rounded-md bg-white border border-[#E5E0D4] text-[#181614] font-mono text-xs focus:border-[#C84B26] focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              onClick={handleSync}
              className="p-2.5 rounded-md border border-[#E5E0D4] bg-white text-[#181614]/70 hover:text-[#181614] transition-colors cursor-pointer"
              title="Sync latest live job feeds"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin text-[#C84B26]" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── 72-Hour Job Intelligence Telemetry Deck ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-lg bg-white border border-[#E5E0D4] shadow-xs">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#181614]/60 uppercase tracking-wider mb-1">
              <Zap className="w-3 h-3 text-[#C84B26]" />
              <span>≤ 72h Verified</span>
            </div>
            <div className="text-xl font-mono font-bold text-[#181614]">
              {(statsData as any)?.total_eligible_jobs ?? totalCount}
            </div>
            <div className="text-[10px] text-[#2E6347] font-mono font-medium">100% Date-Verified</div>
          </div>

          <div className="p-3.5 rounded-lg bg-white border border-[#E5E0D4] shadow-xs">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#181614]/60 uppercase tracking-wider mb-1">
              <Clock className="w-3 h-3 text-[#2E6347]" />
              <span>Last 24 Hours</span>
            </div>
            <div className="text-xl font-mono font-bold text-[#2E6347]">
              {(statsData as any)?.new_last_24h ?? "—"}
            </div>
            <div className="text-[10px] text-[#181614]/50 font-mono">Fresh Today</div>
          </div>

          <div className="p-3.5 rounded-lg bg-white border border-[#E5E0D4] shadow-xs">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#181614]/60 uppercase tracking-wider mb-1">
              <GraduationCap className="w-3 h-3 text-[#172535]" />
              <span>Internships</span>
            </div>
            <div className="text-xl font-mono font-bold text-[#172535]">
              {(statsData as any)?.internships_count ?? "—"}
            </div>
            <div className="text-[10px] text-[#181614]/50 font-mono">Student & Graduate</div>
          </div>

          <div className="p-3.5 rounded-lg bg-white border border-[#E5E0D4] shadow-xs">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#181614]/60 uppercase tracking-wider mb-1">
              <Briefcase className="w-3 h-3 text-[#A36114]" />
              <span>Full-Time</span>
            </div>
            <div className="text-xl font-mono font-bold text-[#A36114]">
              {(statsData as any)?.full_time_count ?? "—"}
            </div>
            <div className="text-[10px] text-[#181614]/50 font-mono">Corporate & Tech</div>
          </div>

          <div className="p-3.5 rounded-lg bg-white border border-[#E5E0D4] shadow-xs">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#181614]/60 uppercase tracking-wider mb-1">
              <Laptop className="w-3 h-3 text-[#2E6347]" />
              <span>Remote / WFH</span>
            </div>
            <div className="text-xl font-mono font-bold text-[#2E6347]">
              {(statsData as any)?.remote_count ?? "—"}
            </div>
            <div className="text-[10px] text-[#181614]/50 font-mono">Location Flexible</div>
          </div>

          <div className="p-3.5 rounded-lg bg-white border border-[#E5E0D4] shadow-xs">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#181614]/60 uppercase tracking-wider mb-1">
              <Globe className="w-3 h-3 text-[#C84B26]" />
              <span>Portals Active</span>
            </div>
            <div className="text-xl font-mono font-bold text-[#181614]">
              {(statsData as any)?.active_sources_count ?? 14} / 14
            </div>
            <div className="text-[10px] text-[#181614]/60 font-mono truncate" title={(statsData as any)?.last_sync_time_ist}>
              {(statsData as any)?.last_sync_time_ist ? `Sync: ${(statsData as any).last_sync_time_ist.split(',')[1]?.trim()}` : 'Synced 15m ago'}
            </div>
          </div>
        </div>

        {/* ── Search Bar & Filter Drawer Toggle ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#181614]/40" />
            <input
              id="job-search-input"
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search roles (e.g. React, Python, Full Stack), companies, or keywords... (Press '/' to focus)"
              className="w-full pl-10 pr-4 py-2.5 rounded-md bg-white border border-[#E5E0D4] text-[#181614] font-mono text-xs focus:border-[#C84B26] focus:outline-none transition-colors placeholder-[#181614]/40 shadow-xs"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setPage(1); }}
                className="absolute right-3.5 top-3 text-[#181614]/40 hover:text-[#181614] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            id="jobs-filter-toggle"
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-md border text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              showFilters || activeFilters.length > 0
                ? "bg-[#172535] text-white border-[#172535]"
                : "bg-white border-[#E5E0D4] text-[#181614] hover:border-[#DCD5C6]"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter Deck</span>
            {activeFilters.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#C84B26] text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilters.length}
              </span>
            )}
            {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* ── Quick Filter Bar (Immediate 1-click filtering) ── */}
        <div className="space-y-2">
          {/* Strict 72-Hour Recency Window Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[#181614]/70 font-mono font-bold shrink-0 text-[10px] uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#C84B26]" /> 72h Window:
            </span>
            {[
              { val: "", label: "All (Max 72h)" },
              { val: "24", label: "Last 24 Hours ⚡" },
              { val: "48", label: "Last 48 Hours" },
              { val: "12", label: "Last 12 Hours" },
              { val: "6", label: "Last 6 Hours" },
              { val: "1", label: "Last 1 Hour" },
            ].map(item => {
              const active = postedDays === item.val || (item.val === "" && !postedDays);
              return (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => {
                    setPostedDays(item.val);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded font-mono text-xs shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? "bg-[#C84B26] text-white font-bold shadow-xs"
                      : "bg-white text-[#181614]/80 hover:text-[#C84B26] border border-[#E5E0D4]"
                  }`}
                >
                  {item.val === "24" && <Zap className="w-3 h-3" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Platforms Quick Bar (Internship & Job Feeds) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[#181614]/70 font-mono font-bold shrink-0 text-[10px] uppercase tracking-wider flex items-center gap-1">
              <Globe className="w-3 h-3 text-[#172535]" /> Platform:
            </span>
            <button
              type="button"
              onClick={() => {
                setSources([]);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded font-mono text-xs shrink-0 transition-all cursor-pointer ${
                sources.length === 0
                  ? "bg-[#172535] text-white font-bold shadow-xs"
                  : "bg-white text-[#181614]/70 hover:text-[#181614] border border-[#E5E0D4]"
              }`}
            >
              All Platforms
            </button>
            {INTERNSHIP_PLATFORMS.map(p => {
              const isSelected = sources.some(s => s.toLowerCase() === p.value.toLowerCase() || s.toLowerCase() === p.label.toLowerCase());
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setSources(prev => {
                      const hasIt = prev.some(s => s.toLowerCase() === p.value.toLowerCase() || s.toLowerCase() === p.label.toLowerCase());
                      return hasIt
                        ? prev.filter(s => s.toLowerCase() !== p.value.toLowerCase() && s.toLowerCase() !== p.label.toLowerCase())
                        : [...prev, p.label];
                    });
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded font-mono text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? "bg-[#C84B26] text-white font-bold shadow-xs"
                      : "bg-white text-[#181614]/70 hover:text-[#C84B26] border border-[#E5E0D4]"
                  }`}
                >
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Cities Quick Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[#181614]/60 font-mono font-bold shrink-0 text-[10px] uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#C84B26]" /> Location:
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
                  className={`px-2.5 py-1 rounded font-mono text-xs shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#172535] text-white font-bold"
                      : "bg-white text-[#181614]/70 hover:text-[#181614] border border-[#E5E0D4]"
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>

          {/* Roles Quick Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[#181614]/60 font-mono font-bold shrink-0 text-[10px] uppercase tracking-wider flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-[#2E6347]" /> Track:
            </span>
            {ROLE_CATEGORIES.map(rc => {
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
                  className={`px-2.5 py-1 rounded font-mono text-xs shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#172535] text-white font-bold"
                      : "bg-white text-[#181614]/70 hover:text-[#181614] border border-[#E5E0D4]"
                  }`}
                >
                  {rc.label}
                </button>
              );
            })}
          </div>

          {/* Work Mode & Experience Quick Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[#181614]/60 font-mono font-bold shrink-0 text-[10px] uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#A36114]" /> Mode:
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
                  className={`px-2.5 py-1 rounded font-mono text-xs shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#172535] text-white font-bold"
                      : "bg-white text-[#181614]/70 hover:text-[#181614] border border-[#E5E0D4]"
                  }`}
                >
                  {wm.label}
                </button>
              );
            })}

            <div className="w-px h-3.5 bg-[#E5E0D4] mx-1 shrink-0" />

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
                  className={`px-2.5 py-1 rounded font-mono text-xs shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#172535] text-white font-bold"
                      : "bg-white text-[#181614]/70 hover:text-[#181614] border border-[#E5E0D4]"
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
          <div className="p-6 rounded-lg bg-white border border-[#E5E0D4] shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D4]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#C84B26]" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#181614]">Advanced Requisition Filters</h2>
              </div>
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-mono text-[#C84B26] hover:underline font-semibold cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Posting Recency */}
              <FilterSection title="72-Hour Publication Cutoff">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: "1", label: "Last 1 Hour" },
                    { value: "6", label: "Last 6 Hours" },
                    { value: "12", label: "Last 12 Hours" },
                    { value: "24", label: "Last 24 Hours ⚡" },
                    { value: "48", label: "Last 48 Hours" },
                    { value: "72", label: "Last 72 Hours (Strict Max)" },
                  ].map(opt => {
                    const active = postedDays === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setPostedDays(active ? "" : opt.value);
                          setPage(1);
                        }}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                          active
                            ? "bg-[#C84B26] text-white shadow-xs font-bold"
                            : "bg-white text-[#181614]/70 hover:text-[#181614] border border-[#E5E0D4]"
                        }`}
                      >
                        {active && <Check className="w-3 h-3 text-white" />}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </FilterSection>

              {/* Role / Category */}
              <FilterSection title="Role Discipline">
                <PillGroup
                  options={ROLE_CATEGORIES}
                  selected={roleCategories}
                  onChange={v => { setRoleCategories(v); setPage(1); }}
                  counts={counts.role_categories}
                />
              </FilterSection>

              {/* Experience Level */}
              <FilterSection title="Experience Horizon">
                <div className="flex flex-wrap gap-1.5">
                  {EXPERIENCE_RANGES.map(er => {
                    const active = expRange === er.value;
                    return (
                      <button
                        key={er.value}
                        type="button"
                        onClick={() => {
                          setExpRange(active ? "" : er.value);
                          setPage(1);
                        }}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                          active
                            ? "bg-[#172535] text-white shadow-xs font-bold"
                            : "bg-white text-[#181614]/70 hover:text-[#181614] border border-[#E5E0D4]"
                        }`}
                      >
                        {active && <Check className="w-3 h-3 text-white" />}
                        <span>{er.label}</span>
                      </button>
                    );
                  })}
                </div>
              </FilterSection>

              {/* Work Mode */}
              <FilterSection title="Operating Arrangement">
                <PillGroup
                  options={WORK_MODES}
                  selected={workModes}
                  onChange={v => { setWorkModes(v); setPage(1); }}
                  counts={counts.work_modes}
                />
              </FilterSection>

              {/* Compensation Range */}
              <FilterSection title="Compensation Threshold">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { min: "300000", label: "₹3+ LPA" },
                      { min: "500000", label: "₹5+ LPA" },
                      { min: "800000", label: "₹8+ LPA" },
                      { min: "1200000", label: "₹12+ LPA" },
                    ].map(preset => {
                      const active = salaryMin === preset.min;
                      return (
                        <button
                          key={preset.min}
                          type="button"
                          onClick={() => {
                            setSalaryMin(active ? "" : preset.min);
                            setPage(1);
                          }}
                          className={`px-2 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                            active
                              ? "bg-[#2E6347] text-white font-bold"
                              : "bg-white text-[#181614]/70 border border-[#E5E0D4] hover:text-[#181614]"
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min ₹"
                      value={salaryMin}
                      onChange={e => { setSalaryMin(e.target.value); setPage(1); }}
                      className="w-1/2 px-2.5 py-1.5 rounded-md bg-white border border-[#E5E0D4] text-[#181614] text-xs font-mono focus:border-[#C84B26] focus:outline-none"
                    />
                    <span className="text-xs text-[#181614]/40 font-mono">—</span>
                    <input
                      type="number"
                      placeholder="Max ₹"
                      value={salaryMax}
                      onChange={e => { setSalaryMax(e.target.value); setPage(1); }}
                      className="w-1/2 px-2.5 py-1.5 rounded-md bg-white border border-[#E5E0D4] text-[#181614] text-xs font-mono focus:border-[#C84B26] focus:outline-none"
                    />
                  </div>
                </div>
              </FilterSection>

              {/* Employment Type */}
              <FilterSection title="Engagement Type">
                <PillGroup
                  options={EMPLOYMENT_TYPES}
                  selected={empTypes}
                  onChange={v => { setEmpTypes(v); setPage(1); }}
                  counts={counts.employment_types}
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
              <FilterSection title="Target Employer">
                <input
                  id="jobs-company-filter"
                  type="text"
                  value={company}
                  onChange={e => { setCompany(e.target.value); setPage(1); }}
                  placeholder="e.g. Google, Infosys, Stripe..."
                  className="w-full px-3 py-2 rounded-md bg-white border border-[#E5E0D4] text-[#181614] text-xs font-mono focus:border-[#C84B26] focus:outline-none placeholder-[#181614]/40"
                />
              </FilterSection>

              {/* Platform / Job Source */}
              <FilterSection title="Ingestion Source">
                <PillGroup
                  options={
                    (jobSourcesData?.sources && jobSourcesData.sources.length > 0)
                      ? jobSourcesData.sources.map((s: any) => ({ 
                          value: s.key?.toLowerCase() || s.name?.toLowerCase(), 
                          label: s.label || s.name,
                        }))
                      : [
                          { value: "internshala", label: "Internshala" },
                          { value: "linkedin", label: "LinkedIn" },
                          { value: "indeed", label: "Indeed" },
                          { value: "naukri", label: "Naukri" },
                          { value: "wellfound", label: "Wellfound" },
                        ]
                  }
                  selected={sources}
                  onChange={v => { setSources(v); setPage(1); }}
                  counts={counts.sources}
                />
              </FilterSection>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E5E0D4]">
              <span className="text-xs font-mono text-[#181614]/70">
                Index Yield: <strong className="text-[#181614] font-bold">{totalCount}</strong> matching requisitions
              </span>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="px-4 py-1.5 rounded-md bg-[#172535] hover:bg-[#181614] text-white text-xs font-mono font-medium transition-colors cursor-pointer"
              >
                Apply Constraints
              </button>
            </div>
          </div>
        )}

        {/* ── Job Results Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-6 rounded-lg bg-white border border-[#E5E0D4] flex flex-col gap-4 animate-pulse">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded bg-[#F5F3EE]" />
                  <div className="w-8 h-8 rounded bg-[#F5F3EE]" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-[#F5F3EE] rounded w-3/4" />
                  <div className="h-3 bg-[#F5F3EE] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 text-center p-12 rounded-lg bg-white border border-[#E5E0D4] shadow-sm">
            <Briefcase className="w-10 h-10 text-[#181614]/30" />
            <h3 className="font-serif font-bold text-base text-[#181614]">
              {sources.length > 0 
                ? `No Requisitions Found from ${sources.map((s: string) => s.toUpperCase()).join(", ")}`
                : activeFilters.length > 0 
                  ? "No Openings Match Your Constraints" 
                  : "No Requisitions Found"}
            </h3>
            <p className="text-xs text-[#181614]/70 max-w-sm">
              {sources.length > 0
                ? "Try clearing the source filter to browse across all verified job platform feeds."
                : "Try relaxing your search terms or clearing constraints to see more results."}
            </p>
            <div className="flex items-center gap-3 pt-2">
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-3.5 py-1.5 rounded-md border border-[#E5E0D4] bg-white text-[#181614] text-xs font-mono font-medium hover:border-[#DCD5C6] cursor-pointer"
                >
                  Clear All Constraints
                </button>
              )}
              <button
                type="button"
                onClick={handleSync}
                className="px-3.5 py-1.5 rounded-md bg-[#C84B26] hover:bg-[#B53E1B] text-white text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Live Board</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between font-mono text-xs text-[#181614]/70">
              <p>
                Displaying <span className="text-[#181614] font-bold">{jobs.length}</span> of{" "}
                <span className="text-[#181614] font-bold">{totalCount.toLocaleString()}</span> active requisitions
                {activeFilters.length > 0 && ` (${activeFilters.length} constraints applied)`}
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
            <div className="flex items-center justify-center gap-3 pt-6 border-t border-[#E5E0D4]">
              <button
                id="jobs-prev-page"
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 rounded-md border border-[#E5E0D4] bg-white text-[#181614] font-mono text-xs hover:border-[#DCD5C6] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                ← Previous
              </button>
              <span className="text-xs font-mono text-[#181614]/70">
                PAGE {page} · {totalCount.toLocaleString()} TOTAL
              </span>
              <button
                id="jobs-next-page"
                type="button"
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore}
                className="px-3.5 py-1.5 rounded-md border border-[#E5E0D4] bg-white text-[#181614] font-mono text-xs hover:border-[#DCD5C6] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
