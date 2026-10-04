/**
 * @interview-ai/job-ingestion
 * Modular multi-board job ingestion, normalization, and deduplication
 */

export interface RawJobPayload {
  externalId: string;
  source: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  postedAt?: string | Date;
  salaryMin?: number;
  salaryMax?: number;
  workMode?: "REMOTE" | "HYBRID" | "ONSITE";
  skills?: string[];
}

export interface IngestedJobResult {
  identityHash: string;
  source: string;
  title: string;
  company: string;
  location: string;
  descriptionSnippet: string;
  url: string;
  postedAt: Date;
  workMode: "REMOTE" | "HYBRID" | "ONSITE";
  skills: string[];
  isDuplicate: boolean;
}

export class JobDeduplicator {
  static generateIdentityHash(company: string, title: string, location: string): string {
    const norm = `${company.trim().toLowerCase()}_${title.trim().toLowerCase()}_${location.trim().toLowerCase()}`;
    return Buffer.from(norm).toString("base64url");
  }
}
