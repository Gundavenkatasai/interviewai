import { RawJob } from "./adapter.interface";
import { PostingDateParser } from "./posting.date.parser";
import { IJob } from "../jobs.model";
import { randomUUID } from "crypto";

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
        postedAt = new Date();
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
        // Could not determine posting date — stamp as discovered time
        // but mark as UNKNOWN so 48h filter treats it correctly
        postedAt = new Date();
        postingDateConfidence = "UNKNOWN";
      }
    } else {
      // No date info at all — this job will NOT pass a strict 48h filter
      postedAt = new Date();
      postingDateConfidence = "UNKNOWN";
    }

    // 5. Freshness bucket
    const now = new Date();
    const hoursDiff = (now.getTime() - postedAt.getTime()) / (1000 * 60 * 60);
    const freshness = postingDateConfidence === "UNKNOWN"
      ? "UNKNOWN"
      : PostingDateParser.freshnessFromHours(hoursDiff);

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
      skills: raw.skills || [],
      source: sourceName,
      sourceJobId: raw.sourceJobId || raw.id,
      sourceUrl: raw.url,
      applyUrl: applyUrl || undefined,
      canonicalUrl: applyUrl || raw.url,
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
    const mediumReliability = ["Naukri", "LinkedIn", "Indeed", "Internshala", "Foundit", "Wellfound", "Cutshort"];
    if (highReliability.includes(source)) return "HIGH";
    if (mediumReliability.includes(source)) return "MEDIUM";
    return "LOW";
  }
}
