import { JobSourceAdapter, JobSearchRequest, JobSearchPage, RawJob, SourceHealth, SourceCapabilities } from "../adapter.interface";

export class AshbyAdapter implements JobSourceAdapter {
  public source = "Ashby";

  getCapabilities(): SourceCapabilities {
    return {
      supportsPagination: false,
      supportsJobDetails: true,
      supportsPostingDate: true, // often in publishedAt
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
    const boardToken = request.companyName?.toLowerCase() || "reddit"; // example ashby board
    
    // Ashby provides a graphql endpoint or a JSON endpoint depending on configuration, but their job-board API is common
    const url = `https://api.ashbyhq.com/posting-api/job-board/${boardToken}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, { signal: controller.signal as any });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) return { jobs: [], hasNextPage: false, totalFetched: 0 };
        throw new Error(`Ashby API error: ${response.status}`);
      }

      const data = await response.json();
      
      const rawJobs: RawJob[] = (data.jobs || []).map((job: any) => ({
        id: String(job.id),
        title: job.title,
        companyName: boardToken,
        location: job.location?.name || "Unknown",
        description: job.descriptionHtml || job.descriptionPlain, // Note: ashby returns detailed jobs differently sometimes
        url: job.jobUrl,
        applyUrl: job.applicationUrl || job.jobUrl,
        postedAt: job.publishedAt ? new Date(job.publishedAt) : new Date(),
        workMode: job.isRemote ? "REMOTE" : undefined,
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
      console.error(`[AshbyAdapter] Failed to fetch ${boardToken}: ${error.message}`);
      throw error;
    }
  }
}
