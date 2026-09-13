import { IJob } from "./jobs.model";
import { TRUST_WEIGHTS, TRUST_ENGINE_VERSION } from "./matching/constants";

export class TrustEngine {
  /**
   * Analyze a job posting and return a Trust Score (0-100) and details.
   */
  static analyzeJob(job: Partial<IJob>): { trustScore: number; details: any, engineVersion: string } {
    let score = 100;
    const evidence: string[] = [];
    
    let isOfficialDomain = false;
    let suspiciousWording = false;

    // Day 4 Integration: jobQualitySignals
    if (job.jobQualitySignals) {
      if (job.jobQualitySignals.hasSuspiciousKeywords) {
        score -= 25;
        evidence.push("Suspicious keywords detected in listing");
        suspiciousWording = true;
      }
      if (job.jobQualitySignals.isRemoteLocationMismatch) {
        score -= 15;
        evidence.push("Mismatch between remote flag and location data");
      }
    }

    // 1. Check for official domain in URLs
    const applyUrl = job.applyUrl || job.applicationUrl || job.sourceUrl || "";
    if (applyUrl) {
      try {
        const urlObj = new URL(applyUrl);
        const domain = urlObj.hostname.toLowerCase();
        
        const knownATS = ["greenhouse.io", "lever.co", "workday.com", "myworkdayjobs.com", "ashbyhq.com", "smartrecruiters.com"];
        const companySlug = (job.companyName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        
        if (knownATS.some(ats => domain.includes(ats))) {
          isOfficialDomain = true;
          evidence.push(`Verified ATS domain (${domain})`);
        } else if (companySlug.length > 3 && domain.includes(companySlug)) {
          isOfficialDomain = true;
          evidence.push(`Domain matches company name (${domain})`);
        } else if (domain.includes("linkedin.com") || domain.includes("indeed.com")) {
          evidence.push(`Posted on trusted job board (${domain})`);
        } else {
          score -= 15;
          evidence.push(`Unverified application domain (${domain})`);
        }
      } catch (e) {
        score -= 20;
        evidence.push("Invalid application URL");
      }
    } else {
      score -= 30;
      evidence.push("Missing application URL");
    }

    // Freshness factor
    if (job.freshness === "STALE") {
      score -= 20;
      evidence.push("Job posting is marked as STALE (>30 days old)");
    } else if (job.freshness === "FRESH") {
      evidence.push("Job posting is FRESH (<48 hours)");
      score = Math.min(100, score + 5);
    }

    // Completeness
    if (!job.description || job.description.length < 200) {
      score -= 20;
      evidence.push("Job description is suspiciously short or missing");
    }

    if (!job.companyName || job.companyName.toLowerCase() === "confidential") {
      score -= 20;
      evidence.push("Company name is hidden");
    }

    // Ensure score bounds
    score = Math.max(0, Math.min(100, score));

    return {
      trustScore: score,
      details: {
        isOfficialDomain,
        suspiciousWording,
        evidence
      },
      engineVersion: TRUST_ENGINE_VERSION
    };
  }
}
