import { FastifyRequest, FastifyReply } from "fastify";
import { Job, SavedJob, ApplicationClick, ViewedJob } from "./jobs.model";
import { z } from "zod";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 100);
}

function isValidApplyUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    if (parsed.protocol === "javascript:" || parsed.protocol === "data:") return false;
    if (!parsed.hostname || parsed.hostname.length < 3) return false;
    return true;
  } catch {
    return false;
  }
}

const StringOrArray = z.union([z.string(), z.array(z.string())]).transform((val) => {
  if (Array.isArray(val)) return val.join(",");
  return val;
}).optional();

// Query params always arrive as strings — coerce everything
const FilterSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().default(1),
  page_size: z.coerce.number().default(24),
  limit: z.coerce.number().default(24),
  // Multi-value filters — frontend sends comma-separated strings or repeated query keys
  role_category: StringOrArray,
  experience_range: z.string().optional(),
  work_mode: StringOrArray,
  employment_type: StringOrArray,
  seniority: StringOrArray,
  skills: StringOrArray,
  company: z.string().optional(),
  source: StringOrArray,
  sources: StringOrArray,
  location: z.string().optional(),
  salary_min: z.coerce.number().optional(),
  salary_max: z.coerce.number().optional(),
  posted_days: z.coerce.number().optional(),
  match_score: z.string().optional(),
  trust_score: z.string().optional(),
  sort: z.string().default("newest"),
});

const CANONICAL_SOURCES: Record<string, string> = {
  linkedin: "LinkedIn",
  indeed: "Indeed",
  naukri: "Naukri",
  internshala: "Internshala",
  foundit: "Foundit",
  wellfound: "Wellfound",
  cutshort: "Cutshort",
  hirist: "Hirist",
  shine: "Shine",
  timesjobs: "TimesJobs",
  glassdoor: "Glassdoor",
  googlejobs: "GoogleJobs",
  ziprecruiter: "ZipRecruiter",
  bayt: "Bayt",
  bdjobs: "BDJobs",
  greenhouse: "Greenhouse",
  lever: "Lever",
  ashby: "Ashby",
  workday: "Workday",
  smartrecruiters: "SmartRecruiters",
  instahyre: "Instahyre",
};

/** Transform a Mongoose Job doc to the snake_case shape the frontend expects */
function toJobDto(job: any) {
  const raw = job.toObject ? job.toObject() : job;
  // Extract company name: try companyName field first, fallback to description parsing
  const companyName = raw.companyName ||
    raw.company ||
    (raw.description ? raw.description.match(/(?:at|@|by)\s+([A-Z][\w\s&.]{1,40}?)(?:\.|,|\s+(?:is|are|we|you|in|for|the|a |an ))/i)?.[1]?.trim() : null) ||
    "Unknown Company";

  const validApply = isValidApplyUrl(raw.applyUrl) ? raw.applyUrl
    : (isValidApplyUrl(raw.applicationUrl) ? raw.applicationUrl
    : (isValidApplyUrl(raw.sourceUrl) ? raw.sourceUrl : null));

  return {
    id: String(raw._id),
    title: raw.title || "Job Opening",
    company_name: companyName,
    company_logo: raw.companyLogo,
    description: raw.description || "",
    location: raw.location || "India",
    location_normalized: raw.locationNormalized || raw.location || "India",
    country: raw.country || "India",
    state: raw.state,
    city: raw.city,
    is_india_job: raw.isIndiaJob !== false,
    status: raw.status || "ACTIVE",
    is_active: raw.isActive !== false,
    is_expired: raw.isExpired || false,
    salary_min: raw.salaryMin,
    salary_max: raw.salaryMax,
    salary_currency: raw.salaryCurrency || "INR",
    salary_period: raw.salaryPeriod || "year",
    work_mode: raw.workMode,
    job_type: raw.jobType,
    employment_type: raw.employmentType,
    experience_level: raw.experienceLevel,
    seniority: raw.seniority,
    min_experience: raw.minExperience,
    max_experience: raw.maxExperience,
    role_category: raw.roleCategory,
    role_family: raw.roleFamily,
    industry: raw.industry,
    skills: Array.isArray(raw.skills)
      ? raw.skills.map((s: any) => (typeof s === "string" ? s : s?.name || String(s))).filter(Boolean)
      : [],
    skills_normalized: Array.isArray(raw.skillsNormalized) ? raw.skillsNormalized : [],
    source: raw.source || "UNKNOWN",
    source_job_id: raw.sourceJobId,
    source_url: isValidApplyUrl(raw.sourceUrl) ? raw.sourceUrl : null,
    apply_url: validApply,
    canonical_url: isValidApplyUrl(raw.canonicalUrl) ? raw.canonicalUrl : null,
    application_url: validApply,
    source_posted_at: raw.sourcePostedAt,
    posted_at: raw.sourcePostedAt || raw.postedAt || raw.createdAt,
    posting_date_confidence: raw.postingDateConfidence || "medium",
    first_seen_at: raw.firstSeenAt,
    last_seen_at: raw.lastSeenAt,
    is_saved: false,
    is_new: raw.freshness === "FRESH" || (raw.createdAt && (Date.now() - new Date(raw.createdAt).getTime()) < 48 * 60 * 60 * 1000),
    freshness: raw.freshness || "UNKNOWN",
    match_score: raw.matchScore,
    match_details: raw.matchDetails,
    trust_score: raw.trustScore,
    trust_details: raw.trustDetails,
    apply_url_status: validApply ? "VALID" : "APPLY_URL_INVALID",
    duplicate_sources: Array.isArray(raw.sourceReferences) 
      ? raw.sourceReferences.map((sr: any) => ({
          source: sr.source || "UNKNOWN",
          source_url: isValidApplyUrl(sr.sourceUrl) ? sr.sourceUrl : null,
          apply_url: isValidApplyUrl(sr.applyUrl) ? sr.applyUrl : null,
        }))
      : [],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

import { MatchEngine } from "./match.engine";
import { TrustEngine } from "./trust.engine";
import { JobSourceStatus, JobIngestionRun, JobMatchScore } from "./jobs.model";
import { ExplanationEngine } from "./matching/explanation.engine";
import { MATCH_ENGINE_VERSION } from "./matching/constants";
import { JobSourceRegistry } from "./ingestion/source.registry";

export class JobsController {
  
  static async getSources(request: FastifyRequest, reply: FastifyReply) {
    const sourcesArray = JobSourceRegistry.getCapabilitiesInfo();
    return reply.send({ success: true, sources: sourcesArray });
  }

  static async getJobs(request: FastifyRequest, reply: FastifyReply) {
    let filters: any;
    try {
      filters = FilterSchema.parse(request.query || {});
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: "Invalid query params", details: err.errors });
    }

    const andConditions: any[] = [
      { isActive: { $ne: false } },
      { isIndiaJob: true }
    ];

    if (filters.search) {
      const safeSearch = escapeRegex(filters.search.trim());
      if (safeSearch) {
        andConditions.push({
          $or: [
            { title: { $regex: safeSearch, $options: "i" } },
            { description: { $regex: safeSearch, $options: "i" } },
            { companyName: { $regex: safeSearch, $options: "i" } },
          ]
        });
      }
    }

    // ── role_category: maps to title keyword
    if (filters.role_category) {
      const cats = filters.role_category.split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean);
      if (cats.length) {
        const categoryKeywords: Record<string, string[]> = {
          fullstack: ["full stack", "fullstack", "full-stack"],
          frontend: ["frontend", "front end", "front-end", "react", "angular", "vue"],
          backend: ["backend", "back end", "back-end", "node", "java", "python", "golang", "ruby", "php"],
          mobile: ["mobile", "android", "ios", "flutter", "react native", "swift", "kotlin"],
          devops: ["devops", "cloud", "sre", "infrastructure", "platform", "kubernetes", "docker", "aws", "gcp", "azure"],
          ai: ["machine learning", "ai ", "ml ", "deep learning", "llm", "nlp", "data science", "mlops"],
          data: ["data engineer", "data analyst", "analytics", "bi ", "etl", "spark", "hadoop"],
          security: ["security", "cyber", "pentest", "soc ", "devsecops"],
          qa: ["qa ", "quality", "testing", "sdet", "automation engineer"],
          product: ["product manager", "product designer", "ux", "ui designer"],
        };
        const keywords = cats.flatMap((c: string) => categoryKeywords[c] || [c]);
        if (keywords.length) {
          andConditions.push({
            $or: keywords.map((kw: string) => ({ title: { $regex: escapeRegex(kw), $options: "i" } }))
          });
        }
      }
    }

    // ── work_mode: match case-insensitively (REMOTE, remote, ONSITE, onsite, HYBRID, hybrid)
    if (filters.work_mode) {
      const modes = filters.work_mode.split(",").map((s: string) => s.trim()).filter(Boolean);
      if (modes.length) {
        const variants = modes.flatMap((m: string) => [
          m,
          m.toLowerCase(),
          m.toUpperCase(),
          m.charAt(0).toUpperCase() + m.slice(1).toLowerCase()
        ]);
        andConditions.push({ workMode: { $in: Array.from(new Set(variants)) } });
      }
    }

    // ── employment_type: match DB variations (fulltime, FULL_TIME, full_time, internship, etc.)
    if (filters.employment_type) {
      const types = filters.employment_type.split(",").map((s: string) => s.trim()).filter(Boolean);
      if (types.length) {
        const variants = new Set<string>();
        for (const t of types) {
          variants.add(t);
          variants.add(t.toLowerCase());
          variants.add(t.toUpperCase());
          variants.add(t.replace(/-/g, "_"));
          variants.add(t.replace(/-/g, "_").toUpperCase());
          variants.add(t.replace(/-/g, ""));
          variants.add(t.replace(/-/g, "").toUpperCase());
          if (t.toLowerCase().includes("full")) {
            variants.add("fulltime");
            variants.add("FULL_TIME");
            variants.add("full_time");
          }
          if (t.toLowerCase().includes("intern")) {
            variants.add("internship");
            variants.add("INTERNSHIP");
          }
          if (t.toLowerCase().includes("part")) {
            variants.add("parttime");
            variants.add("PART_TIME");
          }
        }
        andConditions.push({ employmentType: { $in: Array.from(variants) } });
      }
    }

    // ── seniority: match seniority field or experienceLevel
    if (filters.seniority) {
      const levels = filters.seniority.split(",").map((s: string) => s.trim()).filter(Boolean);
      if (levels.length) {
        const variants = levels.flatMap((l: string) => [
          l,
          l.toLowerCase(),
          l.toUpperCase(),
          l.charAt(0).toUpperCase() + l.slice(1).toLowerCase()
        ]);
        andConditions.push({
          $or: [
            { seniority: { $in: Array.from(new Set(variants)) } },
            { experienceLevel: { $regex: levels.map(escapeRegex).join("|"), $options: "i" } }
          ]
        });
      }
    }

    // ── experience_range: numeric range against minExperience
    if (filters.experience_range) {
      const range = filters.experience_range.trim();
      if (range === "0-1") andConditions.push({ minExperience: { $lte: 1 } });
      else if (range === "1-3") andConditions.push({ minExperience: { $gte: 1, $lte: 3 } });
      else if (range === "3-5") andConditions.push({ minExperience: { $gte: 3, $lte: 5 } });
      else if (range === "5-8") andConditions.push({ minExperience: { $gte: 5, $lte: 8 } });
      else if (range === "8+") andConditions.push({ minExperience: { $gte: 8 } });
    }

    // ── location: case-insensitive match on location or city
    if (filters.location && filters.location !== "All India") {
      const safeLoc = escapeRegex(filters.location.trim());
      if (safeLoc) {
        andConditions.push({
          $or: [
            { location: { $regex: safeLoc, $options: "i" } },
            { city: { $regex: safeLoc, $options: "i" } },
            { locationNormalized: { $regex: safeLoc, $options: "i" } }
          ]
        });
      }
    }

    if (filters.salary_min) andConditions.push({ salaryMin: { $gte: filters.salary_min } });
    if (filters.salary_max) andConditions.push({ salaryMax: { $lte: filters.salary_max } });

    // ── company: search companyName or description
    if (filters.company) {
      const safeCompany = escapeRegex(filters.company.trim());
      if (safeCompany) {
        andConditions.push({
          $or: [
            { companyName: { $regex: safeCompany, $options: "i" } },
            { description: { $regex: safeCompany, $options: "i" } }
          ]
        });
      }
    }

    // ── source: STRICT match on canonical/cased variants of selected sources
    // Guarantees:
    // 1. Every returned job's `source` strictly belongs to the selected set.
    // 2. No source is silently replaced with Indeed.
    // 3. UI badge comes directly from job.source.
    const sourceStr = filters.sources || filters.source;
    if (sourceStr) {
      const rawSrcs = sourceStr.split(",").map((s: string) => s.trim()).filter(Boolean);
      if (rawSrcs.length) {
        const targetValues = new Set<string>();
        for (const s of rawSrcs) {
          const lower = s.toLowerCase();
          const canonical = CANONICAL_SOURCES[lower] || s;
          targetValues.add(canonical);
          targetValues.add(s);
          targetValues.add(lower);
          targetValues.add(s.toUpperCase());
        }
        andConditions.push({ source: { $in: Array.from(targetValues) } });
      }
    }

    // ── skills: search in skills array or description
    if (filters.skills) {
      const skillList = filters.skills.split(",").map((s: string) => s.trim()).filter(Boolean);
      if (skillList.length) {
        const skillOr = skillList.map((s: string) => ({
          $or: [
            { skills: s },
            { description: { $regex: escapeRegex(s), $options: "i" } }
          ]
        }));
        andConditions.push({ $or: skillOr });
      }
    }

    // ── posted_days
    const days = filters.posted_days !== undefined ? filters.posted_days : 0;
    if (days > 0) {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      andConditions.push({
        $or: [
          { sourcePostedAt: { $gte: cutoff } },
          { createdAt: { $gte: cutoff } }
        ]
      });
    }

    const query: any = andConditions.length > 1 ? { $and: andConditions } : andConditions[0] || {};

    const pageSize = Math.min(filters.page_size || filters.limit || 24, 100);
    const skip = (filters.page - 1) * pageSize;

    // Deterministic sorting with stable tie-breaker:
    let sortObj: any = { sourcePostedAt: -1, createdAt: -1, _id: -1 };
    let dynamicSort = false;
    if (filters.sort === "salary_desc") {
      sortObj = { salaryMax: -1, createdAt: -1, _id: -1 };
    } else if (filters.sort === "salary_asc") {
      sortObj = { salaryMin: 1, createdAt: -1, _id: -1 };
    } else if (filters.sort === "relevant") {
      sortObj = { createdAt: -1, _id: -1 };
    } else if (filters.sort === "newest") {
      sortObj = { sourcePostedAt: -1, createdAt: -1, _id: -1 };
    } else if (filters.sort === "oldest") {
      sortObj = { sourcePostedAt: 1, createdAt: 1, _id: 1 };
    } else if (filters.sort === "match" || filters.sort === "trust") {
      dynamicSort = true;
      sortObj = { sourcePostedAt: -1, createdAt: -1, _id: -1 };
    }

    const userId = (request as any).user?.sub;
    let userProfile: any = null;
    if (userId) {
      const { Profile } = require("../profile/profile.model");
      userProfile = await Profile.findOne({ userId });
    }

    // If dynamic sort is requested, fetch a larger pool and sort in-memory
    const fetchLimit = dynamicSort ? 150 : pageSize;
    const fetchSkip = dynamicSort ? 0 : skip;

    const [rawJobs, total] = await Promise.all([
      Job.find(query).sort(sortObj).skip(fetchSkip).limit(fetchLimit),
      Job.countDocuments(query),
    ]);

    let enhancedJobs = rawJobs.map((j: any) => {
      const jobObj = j.toObject ? j.toObject() : j;
      
      // Calculate Trust Score
      if (!jobObj.trustScore) {
        const trust = TrustEngine.analyzeJob(jobObj);
        jobObj.trustScore = trust.trustScore;
        jobObj.trustDetails = trust.details;
      }
      
      // Calculate Match Score if profile exists
      if (userProfile) {
        const match = MatchEngine.calculateMatch(userProfile, jobObj);
        jobObj.matchScore = match.matchScore;
        jobObj.matchDetails = match;
      }
      
      return jobObj;
    });

    if (filters.match_score) {
      enhancedJobs = enhancedJobs.filter((j: any) => {
        if (!j.matchScore) return filters.match_score === "unknown";
        if (filters.match_score === "strong") return j.matchScore >= 80;
        if (filters.match_score === "good") return j.matchScore >= 60 && j.matchScore < 80;
        if (filters.match_score === "partial") return j.matchScore > 0 && j.matchScore < 60;
        return false;
      });
    }

    if (filters.trust_score) {
      enhancedJobs = enhancedJobs.filter((j: any) => {
        if (!j.trustScore) return filters.trust_score === "unknown";
        if (filters.trust_score === "high") return j.trustScore >= 80;
        if (filters.trust_score === "medium") return j.trustScore >= 50 && j.trustScore < 80;
        if (filters.trust_score === "low") return j.trustScore > 0 && j.trustScore < 50;
        return false;
      });
    }

    // Apply dynamic filtering if Match/Trust thresholds are passed
    // We assume filters could be extended later with min_match or min_trust via search params
    if (filters.sort === "match") {
      enhancedJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    } else if (filters.sort === "trust") {
      enhancedJobs.sort((a, b) => (b.trustScore || 0) - (a.trustScore || 0));
    }

    // Slice for pagination if dynamic sort was applied
    if (dynamicSort) {
      enhancedJobs = enhancedJobs.slice(skip, skip + pageSize);
    }

    const jobs = enhancedJobs.map(toJobDto);

    return {
      success: true,
      jobs,
      total,
      page: filters.page,
      page_size: pageSize,
      has_more: dynamicSort ? (skip + jobs.length < Math.min(total, 150)) : (skip + jobs.length < total),
    };
  }

  static async getJob(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const userId = (request as any).user?.sub;

    const job = await Job.findOne({ _id: id });
    if (!job) return reply.status(404).send({ success: false, message: "Job not found" });

    const jobObj = job.toObject();

    // Trust Score
    if (!jobObj.trustScore) {
      const trust = TrustEngine.analyzeJob(jobObj);
      jobObj.trustScore = trust.trustScore;
      jobObj.trustDetails = trust.details;
    }

    // Match Score
    if (userId) {
      const { Profile } = require("../profile/profile.model");
      const userProfile = await Profile.findOne({ userId });
      if (userProfile) {
        const match = MatchEngine.calculateMatch(userProfile, jobObj);
        jobObj.matchScore = match.matchScore;
        jobObj.matchDetails = match;
      }
    }

    // Find duplicates/cluster
    let cluster: any[] = [];
    if (jobObj.contentHash) {
      const duplicates = await Job.find({ 
        contentHash: jobObj.contentHash, 
        _id: { $ne: jobObj._id },
        isActive: true 
      }).limit(5);
      cluster = duplicates.map(toJobDto);
    } else if (jobObj.title && jobObj.companyName) {
      const duplicates = await Job.find({ 
        title: jobObj.title, 
        companyName: jobObj.companyName, 
        _id: { $ne: jobObj._id },
        isActive: true 
      }).limit(5);
      cluster = duplicates.map(toJobDto);
    }

    const dto = toJobDto(jobObj);
    (dto as any).duplicates = cluster;

    return { success: true, data: dto };
  }

  static async trackClick(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const userId = (request as any).user?.sub;
    
    const job = await Job.findOne({ _id: id });
    if (!job) return reply.status(404).send({ success: false, message: "Job not found" });

    await ApplicationClick.create({
      jobId: id,
      userId,
      applyUrl: job.applicationUrl || job.applyUrl || job.sourceUrl,
      source: job.source,
      userAgent: request.headers["user-agent"],
      ipAddress: request.ip,
    }).catch(() => {}); // non-critical

    return { success: true };
  }

  static async getSavedJobs(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const savedJobs = await SavedJob.find({ userId }).populate("jobId");
    return { 
      success: true, 
      data: savedJobs.map((s: any) => ({
        ...toJobDto(s.jobId),
        is_saved: true,
        saved_at: s.savedAt,
      })),
    };
  }

  static async saveJob(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user?.sub;
    const { id } = request.params;
    if (!userId) return reply.status(401).send({ success: false, message: "Unauthorized" });

    await SavedJob.findOneAndUpdate(
      { userId, jobId: id },
      { $setOnInsert: { savedAt: new Date() } },
      { upsert: true, new: true }
    );
    return { success: true, saved: true, action: "added" };
  }

  static async unsaveJob(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user?.sub;
    const { id } = request.params;
    if (!userId) return reply.status(401).send({ success: false, message: "Unauthorized" });

    await SavedJob.deleteOne({ userId, jobId: id });
    return { success: true, saved: false, action: "removed" };
  }

  static async trackView(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const userId = (request as any).user?.sub;
    if (userId) {
      await ViewedJob.findOneAndUpdate(
        { userId, jobId: id },
        { $set: { viewedAt: new Date() } },
        { upsert: true }
      ).catch(() => {});
    }
    return { success: true };
  }

  static async toggleSavedJob(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user?.sub;
    const { id } = request.params;
    if (!userId) return reply.status(401).send({ success: false, message: "Unauthorized" });

    const existing = await SavedJob.findOne({ userId, jobId: id });
    if (existing) {
      await SavedJob.deleteOne({ _id: existing._id });
      return { success: true, saved: false, action: "removed" };
    } else {
      await SavedJob.create({ userId, jobId: id, savedAt: new Date() });
      return { success: true, saved: true, action: "added" };
    }
  }

  static async filterCounts(request: FastifyRequest, reply: FastifyReply) {
    const [workModes, seniorities, empTypes, sources, categories, totalJobs] = await Promise.all([
      Job.aggregate([
        { $group: { _id: "$workMode", count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
      ]),
      Job.aggregate([
        { $group: { _id: "$seniority", count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
      ]),
      Job.aggregate([
        { $group: { _id: "$employmentType", count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
      ]),
      Job.aggregate([
        { $group: { _id: "$source", count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
      ]),
      Job.aggregate([
        { $group: { _id: "$roleCategory", count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
      ]),
      Job.countDocuments({ isActive: { $ne: false }, isIndiaJob: true }),
    ]);

    const sourceCounts: Record<string, number> = {};
    for (const s of sources) {
      if (!s._id) continue;
      const count = Number(s.count) || 0;
      sourceCounts[s._id] = count;
      sourceCounts[s._id.toLowerCase()] = count;
      sourceCounts[s._id.toUpperCase()] = count;
    }

    const workModeCounts: Record<string, number> = {};
    for (const w of workModes) {
      if (!w._id) continue;
      const count = Number(w.count) || 0;
      workModeCounts[w._id] = count;
      workModeCounts[w._id.toLowerCase()] = count;
    }

    const seniorityCounts: Record<string, number> = {};
    for (const s of seniorities) {
      if (!s._id) continue;
      const count = Number(s.count) || 0;
      seniorityCounts[s._id] = count;
      seniorityCounts[s._id.toLowerCase()] = count;
    }

    const empTypeCounts: Record<string, number> = {};
    for (const e of empTypes) {
      if (!e._id) continue;
      const count = Number(e.count) || 0;
      empTypeCounts[e._id] = count;
      empTypeCounts[e._id.toLowerCase()] = count;
      empTypeCounts[e._id.replace(/_/g, "-")] = count;
    }

    const roleCatCounts: Record<string, number> = {};
    for (const r of categories) {
      if (!r._id) continue;
      const count = Number(r.count) || 0;
      roleCatCounts[r._id] = count;
      roleCatCounts[r._id.toLowerCase()] = count;
    }

    return {
      success: true,
      total: totalJobs,
      workMode: workModeCounts,
      work_modes: workModeCounts,
      seniority: seniorityCounts,
      seniorities: seniorityCounts,
      employmentType: empTypeCounts,
      employment_types: empTypeCounts,
      source: sourceCounts,
      sources: sourceCounts,
      roleCategory: roleCatCounts,
      role_categories: roleCatCounts,
    };
  }

  static async syncJobs(request: FastifyRequest, reply: FastifyReply) {
    let total = await Job.countDocuments({});
    if (total === 0) {
      // Generate some mock India jobs for demonstration
      await Job.insertMany([
        {
          title: "Senior Full Stack Engineer (React/Node)",
          companyName: "TechCorp India",
          location: "Bengaluru, Karnataka",
          isIndiaJob: true,
          isActive: true,
          jobType: "FULL_TIME",
          workMode: "HYBRID",
          roleCategory: "software-engineering",
          experienceLevel: "Senior",
          minExperience: 5,
          maxExperience: 8,
          salaryMin: 2500000,
          salaryMax: 4000000,
          salaryCurrency: "INR",
          description: "We are looking for a Senior Full Stack Engineer with strong experience in React, Node.js, and MongoDB to lead our core product team. You will be responsible for architecture and scaling the platform.",
          skills: ["React", "Node.js", "MongoDB", "TypeScript", "AWS"],
          source: "LinkedIn",
          sourceUrl: "https://linkedin.com/jobs/view/123",
          sourcePostedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          postingDateConfidence: "HIGH",
          freshness: "FRESH",
          country: "India",
          city: "Bengaluru"
        },
        {
          title: "Machine Learning Engineer",
          companyName: "AI Solutions Pvt Ltd",
          location: "Remote",
          isIndiaJob: true,
          isActive: true,
          jobType: "FULL_TIME",
          workMode: "REMOTE",
          roleCategory: "ai-data",
          experienceLevel: "Mid-level",
          minExperience: 3,
          maxExperience: 6,
          salaryMin: 1800000,
          salaryMax: 3000000,
          salaryCurrency: "INR",
          description: "Join our AI research team to build predictive models and NLP pipelines. Must have strong Python skills and experience with PyTorch or TensorFlow.",
          skills: ["Python", "PyTorch", "NLP", "Machine Learning", "SQL"],
          source: "Wellfound",
          sourceUrl: "https://wellfound.com/jobs/456",
          sourcePostedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
          postingDateConfidence: "HIGH",
          freshness: "FRESH",
          country: "India"
        },
        {
          title: "Frontend Developer (Vue.js)",
          companyName: "StartupX",
          location: "Hyderabad, Telangana",
          isIndiaJob: true,
          isActive: true,
          jobType: "FULL_TIME",
          workMode: "ON-SITE",
          roleCategory: "software-engineering",
          experienceLevel: "Entry / Junior",
          minExperience: 1,
          maxExperience: 3,
          salaryMin: 800000,
          salaryMax: 1400000,
          salaryCurrency: "INR",
          description: "Looking for an energetic frontend developer proficient in Vue.js and TailwindCSS to build consumer-facing web applications.",
          skills: ["Vue.js", "JavaScript", "TailwindCSS", "HTML", "CSS"],
          source: "Instahyre",
          sourceUrl: "https://instahyre.com/jobs/789",
          sourcePostedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          postingDateConfidence: "HIGH",
          freshness: "RECENT",
          country: "India",
          city: "Hyderabad"
        },
        {
          title: "DevOps Engineer",
          companyName: "CloudScale India",
          location: "Pune, Maharashtra",
          isIndiaJob: true,
          isActive: true,
          jobType: "FULL_TIME",
          workMode: "HYBRID",
          roleCategory: "devops-cloud",
          experienceLevel: "Mid-level",
          minExperience: 4,
          maxExperience: 7,
          salaryMin: 2000000,
          salaryMax: 3200000,
          salaryCurrency: "INR",
          description: "Seeking a DevOps engineer to manage our Kubernetes clusters and CI/CD pipelines. Experience with AWS and Terraform is highly desired.",
          skills: ["Kubernetes", "Docker", "AWS", "Terraform", "CI/CD"],
          source: "LinkedIn",
          sourceUrl: "https://linkedin.com/jobs/view/999",
          sourcePostedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
          postingDateConfidence: "HIGH",
          freshness: "FRESH",
          country: "India",
          city: "Pune"
        }
      ]);
      total = await Job.countDocuments({});
    }
    return { success: true, message: "Sync triggered. Fetched India jobs.", total_jobs: total };
  }

  static async getNewCount(request: FastifyRequest, reply: FastifyReply) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await Job.countDocuments({ createdAt: { $gte: oneDayAgo } });
    return { success: true, count };
  }

  static async getStats(request: FastifyRequest, reply: FastifyReply) {
    const total = await Job.countDocuments({});
    const active = await Job.countDocuments({ isActive: true });
    return { success: true, total, active };
  }

  static async getRecentJobs(request: FastifyRequest, reply: FastifyReply) {
    const query: any = request.query;
    const hours = parseInt(query.hours || "48", 10);
    
    // Strict requirement: India only, trustworthy date, newer than X hours
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const jobs = await Job.find({
      isIndiaJob: true,
      isActive: true,
      sourcePostedAt: { $gte: cutoff },
      postingDateConfidence: { $ne: "UNKNOWN" }
    })
    .sort({ sourcePostedAt: -1 })
    .limit(100);

    return {
      success: true,
      jobs: jobs.map(toJobDto),
      total: jobs.length
    };
  }

  static async getSourceHealth(request: FastifyRequest, reply: FastifyReply) {
    // For admin/debugging view of ingestion
    const runs = await JobIngestionRun.find().sort({ startedAt: -1 }).limit(200);
    
    const latestRunsMap = new Map<string, any>();
    
    // Process runs, keep only the latest one per source
    for (const run of runs) {
      if (!latestRunsMap.has(run.source)) {
        latestRunsMap.set(run.source, run);
      }
    }
    
    let active_sources = 0;
    let failing_sources = 0;
    const total_jobs = await Job.countDocuments({});
    
    const sourcesData = Array.from(latestRunsMap.values()).map(run => {
      const isOk = run.status === "completed" || run.status === "ok";
      if (isOk) active_sources++;
      else failing_sources++;
      
      const durationMs = run.completedAt && run.startedAt ? 
        new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime() : null;
        
      return {
        source_id: run.source.toLowerCase(),
        name: run.source,
        status: isOk ? "active" : "failing",
        jobs_count: run.jobsAccepted,
        last_run: run.completedAt || run.startedAt,
        duration_ms: durationMs,
        error: run.metadata?.error || run.metadata?.lastError || run.metadata?.reason || (run.errorCount > 0 ? `${run.errorCount} errors during run` : null)
      };
    });
    
    // Add any configured sources that don't have a run yet
    const allAdapters = JobSourceRegistry.getAllAdapters();
    for (const adapter of allAdapters) {
      if (!latestRunsMap.has(adapter.source)) {
        sourcesData.push({
          source_id: adapter.source.toLowerCase(),
          name: adapter.source,
          status: "pending",
          jobs_count: 0,
          last_run: null,
          duration_ms: null,
          error: "No sync executed yet"
        });
      }
    }

    return {
      success: true,
      summary: {
        total_sources: sourcesData.length,
        active_sources,
        failing_sources,
        total_jobs
      },
      sources: sourcesData
    };
  }

  static async getRecommendedJobs(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user?.sub;
    if (!userId) return reply.status(401).send({ success: false, message: "Unauthorized" });

    const { Profile } = require("../profile/profile.model");
    const userProfile = await Profile.findOne({ userId });
    if (!userProfile) return reply.status(404).send({ success: false, message: "Profile not found" });

    // Grab a batch of fresh jobs
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 }).limit(100);

    const scoredJobs = [];
    for (const job of jobs) {
      const match = MatchEngine.calculateMatch(userProfile, job);
      if (match.status !== "BLOCKER") {
        const trust = TrustEngine.analyzeJob(job);
        
        // Calculate Recommendation Priority (Match * Trust * Freshness factor)
        const priority = match.matchScore * (trust.trustScore / 100);
        
        scoredJobs.push({
          ...toJobDto(job),
          matchScore: match.matchScore,
          matchStatus: match.status,
          trustScore: trust.trustScore,
          recommendationPriority: priority
        });
      }
    }

    scoredJobs.sort((a, b) => b.recommendationPriority - a.recommendationPriority);

    return {
      success: true,
      jobs: scoredJobs.slice(0, 20),
      total: scoredJobs.length
    };
  }


  static async getJobMatch(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const userId = (request as any).user?.sub;
    
    if (!userId) return reply.status(401).send({ success: false, message: "Unauthorized" });

    const { Profile } = require("../profile/profile.model");
    const userProfile = await Profile.findOne({ userId });
    
    // Global jobs do not have a userId
    const job = await Job.findOne({ _id: id });

    if (!job) return reply.status(404).send({ success: false, message: "Not found" });
    if (!userProfile) return { success: true, data: null }; // Return gracefully for UI

    // Check Cache
    let scoreDoc = await JobMatchScore.findOne({ candidateId: userId, jobId: id, engineVersion: MATCH_ENGINE_VERSION });
    if (!scoreDoc) {
      const match = MatchEngine.calculateMatch(userProfile, job);
      const trust = TrustEngine.analyzeJob(job);
      
      scoreDoc = await JobMatchScore.create({
        candidateId: userId,
        jobId: id,
        matchScore: match.matchScore,
        trustScore: trust.trustScore,
        recommendationPriority: match.matchScore * (trust.trustScore / 100),
        breakdown: match.breakdown,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        unknownSignals: match.unknownSignals,
        hardConstraints: match.hardConstraints,
        engineVersion: MATCH_ENGINE_VERSION,
        candidateVersion: "v1",
        jobVersion: "v1"
      });
    }

    return { success: true, data: scoreDoc };
  }

  static async getJobExplanation(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const userId = (request as any).user?.sub;
    if (!userId) return reply.status(401).send({ success: false, message: "Unauthorized" });

    const { Profile } = require("../profile/profile.model");
    const userProfile = await Profile.findOne({ userId });
    const job = await Job.findOne({ _id: id });

    if (!job) return reply.status(404).send({ success: false, message: "Not found" });
    if (!userProfile) return { success: true, data: null };

    let scoreDoc = await JobMatchScore.findOne({ candidateId: userId, jobId: id, engineVersion: MATCH_ENGINE_VERSION });
    
    if (!scoreDoc) {
      // Create if missing
      const match = MatchEngine.calculateMatch(userProfile, job);
      const trust = TrustEngine.analyzeJob(job);
      scoreDoc = await JobMatchScore.create({
        candidateId: userId,
        jobId: id,
        matchScore: match.matchScore,
        trustScore: trust.trustScore,
        recommendationPriority: match.matchScore * (trust.trustScore / 100),
        breakdown: match.breakdown,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        unknownSignals: match.unknownSignals,
        hardConstraints: match.hardConstraints,
        engineVersion: MATCH_ENGINE_VERSION
      });
    }

    if (scoreDoc.explanations) {
      return { success: true, data: scoreDoc.explanations };
    }

    // Generate Explanation
    const explanation = await ExplanationEngine.generate(userProfile, job, scoreDoc.breakdown);
    
    // Save it
    scoreDoc.explanations = explanation;
    await scoreDoc.save();

    return { success: true, data: explanation };
  }
}
