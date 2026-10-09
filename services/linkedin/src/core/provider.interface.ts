/**
 * Core LinkedIn Data Provider Interfaces and Contracts
 * Every externally sourced record contains full immutable provenance.
 */

export interface DataProvenance {
  source: "public_guest" | "playwright_browser" | "imported" | "manual_input" | "apify_cloud";
  sourceUrl?: string;
  sourceProvider: string;
  retrievedAt: Date;
  contentHash: string; // SHA-256 hash of raw extracted payload
  providerVersion: string;
  isUntrustedExternalContent: true;
}

export interface ProviderCapabilities {
  supportsProfile: boolean;
  supportsPosts: boolean;
  supportsJobs: boolean;
  supportsCompanies: boolean;
  supportsEngagement: boolean;
  supportsSearch: boolean;
}

export type SectionConfidence = "high" | "medium" | "low";
export type SectionStatus = "STRONG" | "GOOD" | "NEEDS_WORK" | "MISSING" | "UNKNOWN";

export interface LinkedInExperienceItem {
  company: string;
  role: string;
  duration?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  location?: string;
  description?: string;
  bullets?: string[];
  skills?: string[];
}

export interface LinkedInEducationItem {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
}

export interface LinkedInCertificationItem {
  name: string;
  issuer: string;
  issueDate?: string;
  expirationDate?: string;
  credentialUrl?: string;
}

export interface LinkedInProjectItem {
  title: string;
  description?: string;
  url?: string;
  skills?: string[];
}

export interface LinkedInProfileData {
  canonicalUrl: string;
  fullName: string;
  headline?: string;
  location?: string;
  about?: string;
  photoUrl?: string;
  bannerUrl?: string;
  customVanityUrl?: string;
  followerCount?: number;
  connectionsCount?: number;
  openToWork?: boolean;
  experience: LinkedInExperienceItem[];
  education: LinkedInEducationItem[];
  skills: string[];
  certifications: LinkedInCertificationItem[];
  projects: LinkedInProjectItem[];
  recommendationsReceivedCount?: number;
  recentActivitySummary?: string;
  rawText: string;
  provenance: DataProvenance;
}

export interface LinkedInPostData {
  postId: string;
  postUrl: string;
  authorName: string;
  authorHeadline?: string;
  authorProfileUrl?: string;
  authorAvatarUrl?: string;
  publishedAt?: Date;
  publishedText: string;
  mediaUrls?: string[];
  reactionCount?: number;
  commentCount?: number;
  shareCount?: number;
  urn?: string;
  provenance: DataProvenance;
}

export interface LinkedInJobData {
  jobId: string;
  title: string;
  company: string;
  companyUrl?: string;
  location: string;
  employmentType?: string;
  workplaceType?: "Remote" | "Hybrid" | "On-site" | "Unknown";
  description: string;
  postedDate?: Date;
  applyUrl?: string;
  skills: string[];
  seniorityLevel?: string;
  provenance: DataProvenance;
}

export interface LinkedInCompanyData {
  companyName: string;
  companyUrl: string;
  industry?: string;
  headquarters?: string;
  companySize?: string;
  websiteUrl?: string;
  description?: string;
  openRolesCount?: number;
  provenance: DataProvenance;
}

export interface LinkedInCommentItem {
  commentId: string;
  authorName: string;
  authorProfileUrl?: string;
  authorHeadline?: string;
  commentText: string;
  reactionCount?: number;
  repliesCount?: number;
  publishedAt?: Date;
}

export interface LinkedInEngagementData {
  postUrl: string;
  postUrn?: string;
  totalReactions?: number;
  totalComments?: number;
  comments: LinkedInCommentItem[];
  topEngagerNames: string[];
  provenance: DataProvenance;
}

export interface LinkedInSearchResult {
  query: string;
  searchType: "profiles" | "posts" | "jobs" | "companies";
  totalEstimatedResults?: number;
  profiles?: Array<{ name: string; headline?: string; location?: string; url: string }>;
  posts?: LinkedInPostData[];
  jobs?: LinkedInJobData[];
  companies?: LinkedInCompanyData[];
  provenance: DataProvenance;
}

export interface ProviderResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: "NOT_FOUND" | "AUTH_WALL" | "RATE_LIMITED" | "INVALID_URL" | "NETWORK_TIMEOUT" | "UNSUPPORTED_OPERATION" | "EMPTY_DATA" | "PROVIDER_ERROR";
    message: string;
    recoverable: boolean;
    rawMessage?: string;
  };
  latencyMs: number;
  provenance: DataProvenance;
}

export interface ProviderHealthStatus {
  providerName: string;
  isHealthy: boolean;
  lastChecked: Date;
  latencyMs: number;
  successRate24h: number; // 0.0 - 1.0
  activeCircuitBreaker: boolean;
  capabilities: ProviderCapabilities;
  statusMessage?: string;
}

export interface JobSearchQuery {
  keyword: string;
  location?: string;
  remoteOnly?: boolean;
  experienceLevel?: string;
  limit?: number;
}

export interface ILinkedInDataProvider {
  readonly name: string;
  readonly version: string;
  readonly capabilities: ProviderCapabilities;

  fetchProfile(url: string, options?: { timeoutMs?: number }): Promise<ProviderResult<LinkedInProfileData>>;
  fetchPosts?(urlOrUsername: string, options?: { limit?: number; timeoutMs?: number }): Promise<ProviderResult<LinkedInPostData[]>>;
  fetchJobs?(query: JobSearchQuery): Promise<ProviderResult<LinkedInJobData[]>>;
  fetchCompany?(urlOrSlug: string): Promise<ProviderResult<LinkedInCompanyData>>;
  fetchEngagement?(postUrl: string): Promise<ProviderResult<LinkedInEngagementData>>;
  search?(query: { query: string; type: "profiles" | "posts" | "jobs" | "companies"; limit?: number }): Promise<ProviderResult<LinkedInSearchResult>>;
  checkHealth(): Promise<ProviderHealthStatus>;
}
