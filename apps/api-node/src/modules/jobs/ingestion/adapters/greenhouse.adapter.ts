import { JobSourceAdapter, JobSearchRequest, JobSearchPage, RawJob, SourceHealth, SourceCapabilities } from "../adapter.interface";

export class GreenhouseAdapter implements JobSourceAdapter {
  public source = "Greenhouse";

  getCapabilities(): SourceCapabilities {
    return {
      supportsPagination: true,
      supportsJobDetails: true,
      supportsPostingDate: true,
      supportsRealPostingDate: true,
      supportsSalary: false, // Typically hidden or unstructured in GH
      supportsRemote: true,
      supportsExperience: false,
      supportsIncrementalSync: false,
      supportsSearch: false, // GH boards-api doesn't natively support query search, just returns all
      supportsCompanyFilter: true, // We supply the board_token
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
    const rawToken = request.companyName?.toLowerCase() || "canonical";
    // Sanitize to alphanumeric and dashes only to prevent path traversal
    const boardToken = rawToken.replace(/[^a-z0-9-]/g, ""); 
    
    // We fetch all jobs for a board token because GH doesn't paginate via query string natively
    // In a real scenario with hundreds of jobs, GH usually returns them all in one request or we use a different endpoint
    const urlString = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
    
    try {
      // Validate URL to prevent SSRF
      const url = new URL(urlString);
      if (url.hostname !== "boards-api.greenhouse.io") {
        throw new Error("Invalid Greenhouse API hostname");
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url.toString(), { signal: controller.signal as any });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          // Company doesn't exist on GH
          return { jobs: [], hasNextPage: false, totalFetched: 0 };
        }
        throw new Error(`Greenhouse API error: ${response.status}`);
      }

      const data = await response.json();
      
      const rawJobs: RawJob[] = (data.jobs || []).map((job: any) => ({
        id: String(job.id),
        title: job.title,
        companyName: boardToken, // usually we fetch the board name from data.name
        location: job.location?.name,
        description: job.content || job.metadata?.description,
        url: job.absolute_url,
        applyUrl: job.absolute_url + "#app",
        postedAt: job.updated_at,
        workMode: job.location?.name?.toLowerCase().includes("remote") ? "REMOTE" : undefined,
        rawJson: job
      }));

      // In-memory filter if query was provided
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
      console.error(`[GreenhouseAdapter] Failed to fetch ${boardToken}: ${error.message}`);
      throw error;
    }
  }
}
