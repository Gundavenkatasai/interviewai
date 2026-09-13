import { JobSourceAdapter, JobSearchRequest, JobSearchPage, RawJob, SourceHealth, SourceCapabilities } from "../adapter.interface";

export class FakeAdapter implements JobSourceAdapter {
  public source = "FakeSource";
  
  public staticJobs: RawJob[] = [];
  public forceError: boolean = false;

  getCapabilities(): SourceCapabilities {
    return {
      supportsPagination: false,
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
      status: this.forceError ? "FAILING" : "HEALTHY",
      jobsFetched: 0,
      jobsAccepted: 0,
      jobsRejected: 0,
      duplicates: 0,
      averageLatency: 10,
      errorRate: this.forceError ? 100 : 0
    };
  }

  async search(request: JobSearchRequest): Promise<JobSearchPage> {
    if (this.forceError) {
      throw new Error("FakeSource forced error for testing");
    }

    return {
      jobs: this.staticJobs,
      hasNextPage: false,
      totalFetched: this.staticJobs.length
    };
  }
}
