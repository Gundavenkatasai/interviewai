import { JobSourceAdapter, JobSearchRequest, JobSearchPage, SourceHealth, SourceCapabilities, StoppedReason } from "../adapter.interface";
import { BrowserService } from "../browser.service";

export class InternshalaAdapter implements JobSourceAdapter {
  public source = "Internshala";

  getCapabilities(): SourceCapabilities {
    return {
      supportsPagination: true,
      supportsJobDetails: true,
      supportsPostingDate: true,
      supportsRealPostingDate: true,
      supportsSalary: true,
      supportsRemote: true,
      supportsExperience: true,
      supportsIncrementalSync: false,
      supportsSearch: true,
      supportsCompanyFilter: true,
    };
  }

  async healthCheck(): Promise<SourceHealth> {
    return {
      source: this.source,
      status: "RESTRICTED",
      jobsFetched: 0,
      jobsAccepted: 0,
      jobsRejected: 0,
      duplicates: 0,
      averageLatency: 0,
      errorRate: 100,
      restriction: "External Limitation: Blocked by Cloudflare or advanced anti-bot protection (403 Forbidden / ERR_ABORTED)."
    };
  }

  async search(request: JobSearchRequest): Promise<JobSearchPage> {
    return {
      jobs: [],
      hasNextPage: false,
      totalFetched: 0,
      stoppedReason: "RESTRICTED"
    };
  }
}
