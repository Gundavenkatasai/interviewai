import { JobSourceAdapter, JobSearchRequest, JobSearchPage, SourceHealth, SourceCapabilities } from "../adapter.interface";

export class LinkedInAdapter implements JobSourceAdapter {
  public source = "LinkedIn";
  private agentReachUrl = "http://localhost:8000";

  getCapabilities(): SourceCapabilities {
    return {
      supportsPagination: true,
      supportsJobDetails: true,
      supportsPostingDate: true,
      supportsRealPostingDate: true,
      supportsSalary: false,
      supportsRemote: true,
      supportsExperience: false,
      supportsIncrementalSync: false,
      supportsSearch: true,
      supportsCompanyFilter: true,
    };
  }

  async healthCheck(): Promise<SourceHealth> {
    try {
      const res = await fetch(`${this.agentReachUrl}/health`);
      if (res.ok) {
        return {
          source: this.source,
          status: "HEALTHY",
          jobsFetched: 0,
          jobsAccepted: 0,
          jobsRejected: 0,
          duplicates: 0,
          averageLatency: 500,
          errorRate: 0
        };
      }
      throw new Error(`Agent-Reach returned ${res.status}`);
    } catch (e: any) {
      return {
          source: this.source,
          status: "RESTRICTED",
          jobsFetched: 0,
          jobsAccepted: 0,
          jobsRejected: 0,
          duplicates: 0,
          averageLatency: 0,
          errorRate: 100,
          restriction: `Agent-Reach sidecar unavailable: ${e.message}`
      };
    }
  }

  async search(request: JobSearchRequest): Promise<JobSearchPage> {
    try {
      const queryParams = new URLSearchParams({
        query: request.query || "software engineer",
        location: request.location || "india",
        page: (request.page || 1).toString()
      });
      
      const res = await fetch(`${this.agentReachUrl}/agent-reach/linkedin/search?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch from Agent-Reach: ${res.statusText}`);
      }
      
      const data = await res.json();
      return {
        jobs: data.jobs || [],
        hasNextPage: data.hasNextPage || false,
        totalFetched: data.jobs?.length || 0,
        stoppedReason: undefined
      };
    } catch (e: any) {
      console.error("[LinkedInAdapter] Agent-Reach fetch failed:", e.message);
      return {
        jobs: [],
        hasNextPage: false,
        totalFetched: 0,
        stoppedReason: "ERROR"
      };
    }
  }
}

