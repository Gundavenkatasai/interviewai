import { RawJob } from "./adapter.interface";
import { PostingDateParser } from "./posting.date.parser";
import { IJob } from "../jobs.model";
import { randomUUID } from "crypto";
import { JobEligibilityEngine } from "../eligibility.engine";
import { JobCategoryClassifier } from "../categories.service";

export class JobNormalizer {

  static normalize(raw: RawJob, sourceName: string): Partial<IJob> | null {
    // 1. Title & Company — reject if missing
    const title = raw.title?.trim() || "";
    const companyName = raw.companyName?.trim() || "";
    if (!title || !companyName) return null;

    // 2. Location & India filter
    const locationInfo = this.normalizeLocation(raw.location || "");
    const isRemote = raw.workMode === "REMOTE"
      || (raw.location || "").toLowerCase().includes("remote");

    // Treat as India job if:
    //   - adapter explicitly flagged it
    //   - our location detector recognised it
    //   - it's a worldwide remote (we include those)
    const isIndia = raw.isIndiaJob !== undefined
      ? raw.isIndiaJob
      : (locationInfo.isIndia || locationInfo.isWorldwideRemote);

    if (!isIndia && !locationInfo.isWorldwideRemote) {
      return null; // not India-relevant
    }

    // 3. URL validation — reject javascript: and non-http
    const applyUrl = raw.applyUrl || raw.url;
    if (applyUrl && (applyUrl.startsWith("javascript:") || applyUrl.startsWith("data:"))) {
      return null; // reject outright
    }
    // Reject localhost / private IPs (SSRF protection)
    if (applyUrl) {
      try {
        const u = new URL(applyUrl);
        const host = u.hostname.toLowerCase();
        if (host === "localhost" || host.startsWith("127.") || host.startsWith("192.168.") || host.startsWith("10.") || host === "::1") {
          return null;
        }
        if (!["http:", "https:"].includes(u.protocol)) return null;
      } catch {
        // invalid URL — accept but flag
      }
    }

    // 4. Posting date — use real source date when available
    let postedAt: Date;
    let postingDateConfidence = "UNKNOWN";

    // Prefer structured postedAt first
    if (raw.postedAt && raw.postedAt !== null) {
      const d = new Date(raw.postedAt as any);
      if (!isNaN(d.getTime())) {
        postedAt = d;
        postingDateConfidence = "SOURCE_DATE";
      } else {
        return null; // Invalid date -> strictly reject
      }
    } else if (raw.postedAtText) {
      // Parse relative text: "2 days ago", "Yesterday", "Sep 12", etc.
      const parsed = PostingDateParser.parse(raw.postedAtText);
      if (parsed.date) {
        postedAt = parsed.date;
        postingDateConfidence = parsed.confidence === "high" ? "HIGH"
          : parsed.confidence === "medium" ? "MEDIUM"
          : "LOW";
      } else {
        // Unknown publication date -> strictly reject
        return null;
      }
    } else {
      // Missing publication date -> strictly reject
      return null;
    }

    // Strict 72-hour Eligibility Evaluation
    const rawDeadline = raw.rawJson ? (raw.rawJson as any).deadline : undefined;
    const eligibility = JobEligibilityEngine.evaluateJob({
      sourcePostedAt: postedAt,
      originalPublishedAt: postedAt,
      postingDateConfidence,
      isActive: true,
      isExpired: false,
      deadline: rawDeadline,
    }, 72);

    if (!eligibility.eligible) {
      return null; // Exceeds 72h, deadline passed, or unverifiable -> strictly reject
    }

    // 5. Freshness bucket
    const now = new Date();
    const hoursDiff = (now.getTime() - postedAt.getTime()) / (1000 * 60 * 60);
    const freshness = PostingDateParser.freshnessFromHours(hoursDiff);

    // 6. Apply URL status
    const applyUrlStatus = applyUrl ? "VALID" : "MISSING";

    // 7. Work mode normalization
    let workMode = "ONSITE";
    if (raw.workMode) {
      const wm = raw.workMode.toUpperCase();
      if (wm.includes("REMOTE")) workMode = "REMOTE";
      else if (wm.includes("HYBRID")) workMode = "HYBRID";
      else if (wm.includes("ON")) workMode = "ONSITE";
      else workMode = raw.workMode;
    } else if (isRemote) {
      workMode = "REMOTE";
    }

    // 8. Employment type
    let employmentType = raw.employmentType || undefined;
    if (!employmentType && raw.isInternship) employmentType = "INTERNSHIP";

    // 9. Categorize into one of 20 canonical categories
    const categoryMatch = JobCategoryClassifier.classify(title, raw.description || "", (raw.skills as string[]) || []);

    return {
      _id: randomUUID(),
      title,
      companyName,
      description: (raw.description || "").substring(0, 10000), // cap at 10KB
      location: raw.location || "India",
      country: raw.country || (isIndia ? "India" : undefined),
      isIndiaJob: isIndia,
      status: "active",
      isActive: true,
      isExpired: false,
      workMode,
      employmentType,
      roleCategory: categoryMatch.slug,
      industry: categoryMatch.label,
      skills: (raw.skills && raw.skills.length > 0) ? raw.skills : this.inferSkills(title),
      source: sourceName,
      sourceJobId: raw.sourceJobId || raw.id,
      sourceUrl: raw.url,
      applyUrl: applyUrl || undefined,
      canonicalUrl: applyUrl || raw.url,
      originalPublishedAt: postedAt,
      postedAt,
      sourcePostedAt: postedAt,
      postingDateConfidence,
      freshness,
      applyUrlStatus,
      salaryCurrency: "INR",
      salaryPeriod: "year",

      jobQualitySignals: {
        hasDescription: !!(raw.description && raw.description.length > 50),
        hasCompany: true,
        hasApplyUrl: !!raw.applyUrl,
        postingDateConfidence,
        sourceReliability: this.getSourceReliability(sourceName)
      },
      sourceReferences: [{
        source: sourceName,
        sourceJobId: raw.sourceJobId || raw.id,
        sourceUrl: raw.url,
        applyUrl: raw.applyUrl,
        firstSeenAt: new Date()
      }]
    };
  }

  static normalizeLocation(location: string): { isIndia: boolean; isWorldwideRemote: boolean } {
    const locLower = location.toLowerCase();

    // Major Indian cities and regions
    const indiaCities = [
      "bengaluru", "bangalore", "mumbai", "bombay", "pune", "hyderabad",
      "chennai", "madras", "delhi", "new delhi", "ncr", "gurgaon", "gurugram",
      "noida", "faridabad", "ghaziabad", "kolkata", "calcutta", "ahmedabad",
      "surat", "jaipur", "kochi", "cochin", "coimbatore", "indore", "lucknow",
      "bhubaneswar", "thiruvananthapuram", "trivandrum", "mysore", "mysuru",
      "mohali", "chandigarh", "phagwara", "jalandhar", "nagpur", "vizag",
      "visakhapatnam", "vadodara", "baroda", "rajkot", "agra", "varanasi",
      "india", "in, india", "pan india", "anywhere in india", "all india",
    ];

    const isIndia = indiaCities.some(city => locLower.includes(city));

    // Worldwide remote — include these as India-relevant
    const isWorldwideRemote = locLower.includes("worldwide")
      || locLower.includes("anywhere")
      || locLower === "remote"
      || locLower === "work from home"
      || locLower === "wfh"
      || (locLower.includes("remote") && !locLower.includes("us only") && !locLower.includes("eu only") && !locLower.includes("uk only") && !locLower.includes("us-only"));

    return { isIndia, isWorldwideRemote };
  }

  static getSourceReliability(source: string): string {
    const highReliability = ["Greenhouse", "Lever", "Ashby", "Workday", "SmartRecruiters", "iCIMS", "Recruitee", "Workable"];
    const mediumReliability = ["Naukri", "LinkedIn", "Indeed", "Internshala", "Foundit", "Wellfound", "Cutshort", "Unstop", "AICTE Internship", "Freshersworld", "LetsIntern", "Youth4work", "Foundit Zuno"];
    if (highReliability.includes(source)) return "HIGH";
    if (mediumReliability.includes(source)) return "MEDIUM";
    return "LOW";
  }

  static inferRoleCategory(title: string): string {
    const t = (title || "").toLowerCase();
    if (t.includes("front end") || t.includes("frontend") || t.includes("web developer") || t.includes("ui") || t.includes("react") || t.includes("angular") || t.includes("vue") || t.includes("html") || t.includes("wordpress")) {
      return "frontend";
    }
    if (t.includes("backend") || t.includes("back end") || t.includes("node") || t.includes("java") || t.includes("python") || t.includes("golang") || t.includes("c++") || t.includes(".net") || t.includes("php") || t.includes("django") || t.includes("spring")) {
      return "backend";
    }
    if (t.includes("android") || t.includes("ios") || t.includes("mobile") || t.includes("flutter") || t.includes("react native") || t.includes("swift") || t.includes("kotlin")) {
      return "mobile";
    }
    if (t.includes("qa") || t.includes("tester") || t.includes("testing") || t.includes("automation") || t.includes("quality") || t.includes("sdet")) {
      return "qa";
    }
    if (t.includes("devops") || t.includes("cloud") || t.includes("aws") || t.includes("azure") || t.includes("sre") || t.includes("network") || t.includes("infrastructure") || t.includes("system admin")) {
      return "devops";
    }
    if (t.includes("ai ") || t.includes("ai-") || t.includes("artificial intelligence") || t.includes("machine learning") || t.includes("deep learning") || t.includes("ml ") || t.includes("nlp") || t.includes("computer vision") || t.includes("generative ai") || t.includes("genai") || t.includes("llm")) {
      return "ai";
    }
    if (t.includes("data") || t.includes("analyst") || t.includes("analytics") || t.includes("bi developer") || t.includes("tableau") || t.includes("power bi") || t.includes("database") || t.includes("sql")) {
      return "data";
    }
    if (t.includes("full stack") || t.includes("fullstack") || t.includes("software engineer") || t.includes("software developer") || t.includes("sde") || t.includes("trainee engineer")) {
      return "fullstack";
    }
    if (t.includes("product") || t.includes("sales") || t.includes("marketing") || t.includes("business development") || t.includes("graphic") || t.includes("designer") || t.includes("operations") || t.includes("hr ") || t.includes("human resources")) {
      return "product";
    }
    return "other";
  }

  static inferSkills(title: string): string[] {
    const t = (title || "").toLowerCase();
    if (t.includes("front end") || t.includes("frontend") || t.includes("web developer")) {
      return ["React", "TypeScript", "JavaScript", "HTML5", "CSS3", "Tailwind"];
    }
    if (t.includes("wordpress") || t.includes("php")) {
      return ["WordPress", "PHP", "JavaScript", "HTML5", "CSS3", "MySQL"];
    }
    if (t.includes("java")) {
      return ["Java", "Spring Boot", "PostgreSQL", "REST APIs", "Microservices"];
    }
    if (t.includes("backend") || t.includes("back end") || t.includes("node")) {
      return ["Node.js", "Express", "PostgreSQL", "Docker", "REST APIs"];
    }
    if (t.includes("python") || t.includes("django") || t.includes("fastapi")) {
      return ["Python", "FastAPI", "PostgreSQL", "Docker", "REST APIs"];
    }
    if (t.includes("android") || t.includes("mobile") || t.includes("ios") || t.includes("flutter")) {
      return ["Android", "Kotlin", "Java", "Mobile", "REST APIs"];
    }
    if (t.includes("qa") || t.includes("tester") || t.includes("testing") || t.includes("automation")) {
      return ["QA", "Automation", "Selenium", "Testing", "Python", "Postman"];
    }
    if (t.includes("cloud") || t.includes("devops") || t.includes("network")) {
      return ["AWS", "Cloud", "Docker", "Linux", "Kubernetes", "Networking"];
    }
    if (t.includes("ai") || t.includes("machine learning") || t.includes("vision")) {
      return ["Python", "Machine Learning", "TensorFlow", "PyTorch", "LLM"];
    }
    if (t.includes("data") || t.includes("analytics")) {
      return ["SQL", "Python", "ETL", "PostgreSQL", "Analytics"];
    }
    if (t.includes("sales") || t.includes("business development")) {
      return ["Sales", "Business Development", "Lead Generation", "CRM"];
    }
    if (t.includes("marketing") || t.includes("social media")) {
      return ["Digital Marketing", "SEO", "Content Strategy", "Social Media"];
    }
    if (t.includes("design") || t.includes("graphic")) {
      return ["Figma", "UI/UX", "Adobe Photoshop", "Canva"];
    }
    if (t.includes("hr") || t.includes("human resources")) {
      return ["HR Operations", "Talent Acquisition", "Recruitment", "Communication"];
    }
    return ["Problem Solving", "Communication", "Analytical Skills", "Computer Science"];
  }
}
