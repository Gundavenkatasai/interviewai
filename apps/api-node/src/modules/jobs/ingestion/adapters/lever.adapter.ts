import { JobSourceAdapter, JobSearchRequest, JobSearchPage, RawJob, SourceHealth, SourceCapabilities } from "../adapter.interface";

export class LeverAdapter implements JobSourceAdapter {
  public source = "Lever";

  getCapabilities(): SourceCapabilities {
    return {
      supportsPagination: false,
      supportsJobDetails: true,
      supportsPostingDate: true,
      supportsRealPostingDate: true,
      supportsSalary: false,
      supportsRemote: true,
      supportsExperience: false,
      supportsIncrementalSync: false,
      supportsSearch: false,
      supportsCompanyFilter: true,
    };
  }

  async healthCheck(): Promise<SourceHealth> {
    return {
      source: this.source,
      status: "HEALTHY",
      jobsFetched: 0,
      jobsAccepted: 0,
      jobsRejected: 0,
      duplicates: 0,
      averageLatency: 150,
      errorRate: 0
    };
  }

  async search(request: JobSearchRequest): Promise<JobSearchPage> {
    const boardToken = request.companyName?.toLowerCase() || "netflix"; 
    
    const url = `https://api.lever.co/v0/postings/${boardToken}?mode=json`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, { signal: controller.signal as any });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) return { jobs: [], hasNextPage: false, totalFetched: 0 };
        throw new Error(`Lever API error: ${response.status}`);
      }

      const data = await response.json();
      
      const rawJobs: RawJob[] = (data || []).map((job: any) => ({
        id: String(job.id),
        title: job.text,
        companyName: boardToken,
        location: job.categories?.location || "Unknown",
        description: job.descriptionPlain || job.description,
        url: job.hostedUrl,
        applyUrl: job.applyUrl,
        postedAt: new Date(job.createdAt),
        workMode: job.workplaceType === "remote" ? "REMOTE" : undefined,
        rawJson: job
      }));

      let filteredJobs = rawJobs;
      if (request.query) {
        const lowerQ = request.query.toLowerCase();
        filteredJobs = rawJobs.filter(j => j.title.toLowerCase().includes(lowerQ));
      }

      return {
        jobs: filteredJobs,
        hasNextPage: false,
        totalFetched: filteredJobs.length
      };

    } catch (error: any) {
      console.error(`[LeverAdapter] Failed to fetch ${boardToken}: ${error.message}`);
      throw error;
    }
  }
}
