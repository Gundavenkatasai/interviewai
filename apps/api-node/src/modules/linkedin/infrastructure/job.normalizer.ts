import { LinkedInJobData, DataProvenance } from "../domain/provider.interface";
import { ContentHasher } from "./content.hasher";
import { ProfileNormalizer } from "./profile.normalizer";

export class JobNormalizer {
  static normalize(raw: {
    jobId?: string;
    title: string;
    company: string;
    companyUrl?: string;
    location?: string;
    employmentType?: string;
    workplaceType?: "Remote" | "Hybrid" | "On-site" | "Unknown";
    description?: string;
    postedDate?: Date | string;
    applyUrl?: string;
    skills?: string[];
    seniorityLevel?: string;
    source: DataProvenance["source"];
    sourceProvider: string;
    providerVersion: string;
  }): LinkedInJobData {
    const description = ProfileNormalizer.sanitizeText(raw.description || "");
    const title = ProfileNormalizer.sanitizeText(raw.title || "Job Opening");
    const company = ProfileNormalizer.sanitizeText(raw.company || "Company");
    const location = ProfileNormalizer.sanitizeText(raw.location || "Remote");
    const contentHash = ContentHasher.hash(`${title}|${company}|${description}`);
    const jobId = raw.jobId || contentHash.slice(0, 16);

    const skills = Array.isArray(raw.skills)
      ? raw.skills.map((s) => ProfileNormalizer.sanitizeText(s)).filter(Boolean)
      : [];

    return {
      jobId,
      title,
      company,
      companyUrl: raw.companyUrl?.trim(),
      location,
      employmentType: raw.employmentType ? ProfileNormalizer.sanitizeText(raw.employmentType) : "Full-time",
      workplaceType: raw.workplaceType || (location.toLowerCase().includes("remote") ? "Remote" : "On-site"),
      description,
      postedDate: raw.postedDate ? new Date(raw.postedDate) : new Date(),
      applyUrl: raw.applyUrl?.trim(),
      skills,
      seniorityLevel: raw.seniorityLevel ? ProfileNormalizer.sanitizeText(raw.seniorityLevel) : undefined,
      provenance: {
        source: raw.source,
        sourceUrl: raw.applyUrl,
        sourceProvider: raw.sourceProvider,
        retrievedAt: new Date(),
        contentHash,
        providerVersion: raw.providerVersion,
        isUntrustedExternalContent: true,
      },
    };
  }

  /**
   * Adapts normalized LinkedIn job into the core Interview AI Job schema
   */
  static toCoreJobPayload(job: LinkedInJobData): Record<string, any> {
    return {
      title: job.title,
      companyName: job.company,
      description: job.description,
      location: job.location,
      workMode: job.workplaceType || "Remote",
      employmentType: job.employmentType || "Full-time",
      skills: job.skills.map((name) => ({ name, source: "linkedin_extraction" })),
      skillsNormalized: job.skills.map((s) => s.toLowerCase()),
      source: "linkedin",
      sourceJobId: job.jobId,
      sourceUrl: job.applyUrl || `https://www.linkedin.com/jobs/view/${job.jobId}/`,
      canonicalUrl: job.applyUrl || `https://www.linkedin.com/jobs/view/${job.jobId}/`,
      applyUrl: job.applyUrl,
      postedAt: job.postedDate || new Date(),
      contentHash: job.provenance.contentHash,
      status: "ACTIVE",
      isActive: true,
      isExpired: false,
      dataQualityScore: 90,
      trustScore: 92,
      isIndiaJob: job.location.toLowerCase().includes("india"),
    };
  }
}
