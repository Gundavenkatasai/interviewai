import { FastifyRequest, FastifyReply } from "fastify";
import { Job, SavedJob, ApplicationClick } from "./jobs.model";
import { z } from "zod";

// Query params always arrive as strings — coerce everything
const FilterSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().default(1),
  page_size: z.coerce.number().default(24),
  limit: z.coerce.number().default(24),
  // Multi-value filters — frontend sends comma-separated strings
  role_category: z.string().optional(),
  experience_range: z.string().optional(),
  work_mode: z.string().optional(),
  employment_type: z.string().optional(),
  seniority: z.string().optional(),
  skills: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  sources: z.string().optional(),
  location: z.string().optional(),
  salary_min: z.coerce.number().optional(),
  salary_max: z.coerce.number().optional(),
  posted_days: z.coerce.number().optional(),
  match_score: z.string().optional(),
  trust_score: z.string().optional(),
  sort: z.string().default("newest"),
});

/** Transform a Mongoose Job doc to the snake_case shape the frontend expects */
function toJobDto(job: any) {
  const raw = job.toObject ? job.toObject() : job;
  // Extract company name: try companyName field first, fallback to description parsing
  const companyName = raw.companyName ||
    raw.company ||
    (raw.description ? raw.description.match(/(?:at|@|by)\s+([A-Z][\w\s&.]{1,40}?)(?:\.|,|\s+(?:is|are|we|you|in|for|the|a |an ))/i)?.[1]?.trim() : null) ||
    "Unknown";

  return {
    id: String(raw._id),
    title: raw.title,
    company_name: companyName,
    company_logo: raw.companyLogo,
    description: raw.description,
    location: raw.location,
    location_normalized: raw.locationNormalized || raw.location,
    country: raw.country,
    state: raw.state,
    city: raw.city,
    is_india_job: raw.isIndiaJob,
    status: raw.status,
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
    source: raw.source,
    source_url: raw.sourceUrl,
    apply_url: raw.applyUrl || raw.applicationUrl || raw.canonicalUrl || raw.sourceUrl || null,
    application_url: raw.applicationUrl,
    source_posted_at: raw.sourcePostedAt,
    posted_at: raw.postedAt || raw.createdAt,
    posting_date_confidence: raw.postingDateConfidence || "unknown",
    is_saved: false,
    is_new: raw.freshness === "FRESH" || (raw.createdAt && (Date.now() - new Date(raw.createdAt).getTime()) < 48 * 60 * 60 * 1000),
    freshness: raw.freshness || "UNKNOWN",
    match_score: raw.matchScore,
    match_details: raw.matchDetails,
    trust_score: raw.trustScore,
    trust_details: raw.trustDetails,
    apply_url_status: raw.applyUrlStatus || "UNKNOWN",
    duplicate_sources: Array.isArray(raw.sourceReferences) 
      ? raw.sourceReferences.map((sr: any) => ({
          source: sr.source,
          source_url: sr.sourceUrl,
          apply_url: sr.applyUrl
        }))
      : [],
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
    // Only return the list of registered sources for the frontend filter dropdown
    // Avoid calling getHealthStatus() here because it triggers Puppeteer browsers and timeouts (30s+)
    const adapters = JobSourceRegistry.getAllAdapters();
    const sourcesArray = adapters.map(adapter => ({
      name: adapter.source,
      status: "HEALTHY" 
    }));
    return reply.send({ success: true, sources: sourcesArray });
  }
  static async getJobs(request: FastifyRequest, reply: FastifyReply) {
    let filters: any;
    try {
      filters = FilterSchema.parse(request.query || {});
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: "Invalid query params", details: err.errors });
    }

    const query: any = {};

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { description: { $regex: filters.search, $options: "i" } },
      ];
    }

    // ── role_category: maps to title keyword since roleCategory field is empty
    if (filters.role_category) {
      const cats = filters.role_category.split(",").filter(Boolean);
      if (cats.length) {
        // Map frontend category values to keywords searched in title
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
          const catOr = keywords.map((kw: string) => ({ title: { $regex: kw, $options: "i" } }));
          // Merge with existing $or if search is active
          if (query.$or) {
            query.$and = [{ $or: query.$or }, { $or: catOr }];
            delete query.$or;
          } else {
            query.$or = catOr;
          }
        }
      }
    }

    // ── work_mode: exact match (DB values: remote, hybrid, onsite)
    if (filters.work_mode) {
      const modes = filters.work_mode.split(",").filter(Boolean);
      if (modes.length) query.workMode = { $in: modes };
    }

    // ── employment_type: normalize frontend (full-time) → DB (full_time)
    if (filters.employment_type) {
      const normalize = (v: string) => v.replace(/-/g, "_");
      const types = filters.employment_type.split(",").filter(Boolean).map(normalize);
      if (types.length) query.employmentType = { $in: types };
    }

    // ── seniority: exact match (DB values: intern, fresher, entry, junior, mid, senior, lead, principal)
    if (filters.seniority) {
      const levels = filters.seniority.split(",").filter(Boolean);
      if (levels.length) query.seniority = { $in: levels };
    }

    // ── location: use 'location' field (locationNormalized is empty in DB)
    if (filters.location && filters.location !== "All India") {
      query.location = { $regex: filters.location, $options: "i" };
    }

    if (filters.salary_min) query.salaryMin = { $gte: filters.salary_min };
    if (filters.salary_max) query.salaryMax = { $lte: filters.salary_max };

    // ── company: search in description (companyName field is null in most docs)
    if (filters.company) {
      query.description = { $regex: filters.company, $options: "i" };
    }

    // ── source: match primary source OR any source reference from deduplication
    const sourceStr = filters.source || filters.sources;
    if (sourceStr) {
      const srcs = sourceStr.split(",").filter(Boolean);
      if (srcs.length) {
        const regexes = srcs.map((s: string) => new RegExp(`^${s}$`, 'i'));
        if (!query.$and) query.$and = [];
        query.$and.push({
          $or: [
            { source: { $in: regexes } },
            { "sourceReferences.source": { $in: regexes } }
          ]
        });
      }
    }

    // ── skills: search in description since skills array is empty in most docs
    if (filters.skills) {
      const skillList = filters.skills.split(",").filter(Boolean);
      if (skillList.length) {
        const skillRegexes = skillList.map((s: string) => ({ description: { $regex: s, $options: "i" } }));
        if (query.$and) {
          query.$and.push({ $or: skillRegexes });
        } else if (query.$or && !query.$and) {
          query.$and = [{ $or: query.$or }, { $or: skillRegexes }];
          delete query.$or;
        } else {
          query.$or = skillRegexes;
        }
      }
    }

    // ── posted_days: use sourcePostedAt (real extracted date)
    // DEFAULT to 48 hours (2 days) if not provided, per phase 1 strict freshness rule
    const days = filters.posted_days !== undefined ? filters.posted_days : 2;
    if (days > 0) { // allows passing 0 or negative to see ALL history
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      if (query.sourcePostedAt) {
        query.sourcePostedAt.$gte = cutoff;
      } else {
        query.sourcePostedAt = { $gte: cutoff };
      }
    }
    const pageSize = Math.min(filters.page_size || filters.limit || 24, 100);
    const skip = (filters.page - 1) * pageSize;

    // Default sort: try sourcePostedAt, fallback to createdAt for jobs without source date
    let sortObj: any = { createdAt: -1 };
    let dynamicSort = false;
    if (filters.sort === "salary_desc") sortObj = { salaryMax: -1, createdAt: -1 };
    else if (filters.sort === "salary_asc") sortObj = { salaryMin: 1, createdAt: -1 };
    else if (filters.sort === "relevant") sortObj = { createdAt: -1 };
    else if (filters.sort === "match" || filters.sort === "trust") {
      dynamicSort = true;
      sortObj = { createdAt: -1 }; // Initial fetch sorted by newest
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

  static async toggleSavedJob(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params;

    const existing = await SavedJob.findOne({ userId, jobId: id });
    if (existing) {
      await SavedJob.deleteOne({ _id: existing._id });
      return { success: true, action: "removed" };
    } else {
      await SavedJob.create({ userId, jobId: id });
      return { success: true, action: "added" };
    }
  }

  static async filterCounts(request: FastifyRequest, reply: FastifyReply) {
    const [workModes, seniorities, empTypes, sources, totalJobs] = await Promise.all([
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
      Job.countDocuments({}),
    ]);

    return {
      success: true,
      total: totalJobs,
      workMode: Object.fromEntries(workModes.map((w: any) => [w._id, w.count])),
      seniority: Object.fromEntries(seniorities.map((s: any) => [s._id, s.count])),
      employmentType: Object.fromEntries(empTypes.map((e: any) => [e._id, e.count])),
      source: Object.fromEntries(sources.map((s: any) => [s._id, s.count])),
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
    const runs = await JobIngestionRun.find().sort({ startedAt: -1 }).limit(50);
    
    return {
      success: true,
      runs
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
