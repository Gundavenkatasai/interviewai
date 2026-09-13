export interface SourceCapabilities {
  supportsPagination: boolean;
  supportsJobDetails: boolean;
  supportsPostingDate: boolean;
  supportsRealPostingDate: boolean; // true = source returns actual date/relative time; false = only crawl time known
  supportsSalary: boolean;
  supportsRemote: boolean;
  supportsExperience: boolean;
  supportsIncrementalSync: boolean;
  supportsSearch: boolean;
  supportsCompanyFilter: boolean;
}

export interface SourceHealth {
  source: string;
  status: "HEALTHY" | "DEGRADED" | "FAILING" | "DISABLED" | "UNAVAILABLE" | "RESTRICTED" | "RESTRICTED_NO_AUTH";
  lastSuccessfulRun?: Date;
  lastFailure?: Date;
  jobsFetched: number;
  jobsAccepted: number;
  jobsRejected: number;
  duplicates: number;
  averageLatency: number;
  errorRate: number;
  restriction?: string; // human-readable restriction reason
}

export interface JobSearchRequest {
  query?: string;
  location?: string;
  page?: number;
  cursor?: string;
  limit?: number;
  companyName?: string;
  postedWithinHours?: number; // max age of jobs to fetch
}

export interface RawJob {
  id: string;
  title: string;
  companyName: string;
  location?: string;
  description?: string;
  url: string;
  applyUrl?: string;
  postedAt?: Date | string | null; // null = not available from source
  postedAtText?: string; // raw text: "2 days ago", "Posted 5h ago", "Sep 12"
  salaryText?: string;
  workMode?: string;
  experienceText?: string;
  employmentType?: string;
  skills?: string[];
  isInternship?: boolean;
  isIndiaJob?: boolean;
  country?: string;
  sourceJobId?: string; // platform-specific job ID when available
  rawJson?: any;
}

export type StoppedReason =
  | "EXHAUSTED"       // no more results
  | "OLDER_THAN_48H"  // results were getting older than threshold
  | "SOURCE_LIMIT"    // source returned a hard cap
  | "RATE_LIMIT"      // got rate-limited
  | "ERROR"           // non-retryable error
  | "CONFIGURED_MAX"  // reached max pages configuration
  | "CAPTCHA"         // CAPTCHA detected
  | "NO_RESULTS";     // source returned no jobs

export interface JobSearchPage {
  jobs: RawJob[];
  hasNextPage: boolean;
  nextCursor?: string;
  nextPage?: number;
  totalFetched: number;
  pagesScanned?: number;
  stoppedReason?: StoppedReason;
}

export interface JobSourceAdapter {
  source: string;
  search(request: JobSearchRequest): Promise<JobSearchPage>;
  getJob?(id: string): Promise<RawJob | null>;
  healthCheck(): Promise<SourceHealth>;
  getCapabilities(): SourceCapabilities;
}
