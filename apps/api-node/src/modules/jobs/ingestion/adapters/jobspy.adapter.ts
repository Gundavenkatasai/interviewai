import axios from "axios";
import { JobSourceAdapter, JobSearchRequest, JobSearchPage, SourceHealth, SourceCapabilities, StoppedReason, RawJob } from "../adapter.interface";
import { randomUUID } from "crypto";

const JOBSPY_SIDECAR_URL = process.env.JOBSPY_SIDECAR_URL || "http://localhost:8000";

export class JobSpyAdapter implements JobSourceAdapter {
  public source: string;

  constructor(sourceName: string) {
    this.source = sourceName;
  }

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
      supportsCompanyFilter: false, // JobSpy doesn't natively expose company filtering in basic search yet
    };
  }

  async healthCheck(): Promise<SourceHealth> {
    try {
      const response = await axios.get(`${JOBSPY_SIDECAR_URL}/health`, { timeout: 5000 });
      if (response.data?.status === "ok") {
        return {
          source: this.source,
          status: "HEALTHY",
          jobsFetched: 0,
          jobsAccepted: 0,
          jobsRejected: 0,
          duplicates: 0,
          averageLatency: 200,
          errorRate: 0
        };
      }
      throw new Error("Invalid health response");
    } catch (err: any) {
      return {
          source: this.source,
          status: "UNAVAILABLE",
          jobsFetched: 0,
          jobsAccepted: 0,
          jobsRejected: 0,
          duplicates: 0,
          averageLatency: 0,
          errorRate: 100,
          restriction: `JobSpy sidecar unreachable: ${err.message}`
      };
    }
  }

  async search(request: JobSearchRequest): Promise<JobSearchPage> {
    console.log(`[JobSpyAdapter:${this.source}] Scraping for: ${request.query} on page ${request.page || 1}`);
    const jobs: RawJob[] = [];
    let stoppedReason: StoppedReason | undefined;
    let totalFetched = 0;
    
    try {
      let mappedSite = this.source.toLowerCase();
      if (mappedSite === "googlejobs") mappedSite = "google";
      if (mappedSite === "ziprecruiter") mappedSite = "zip_recruiter";

      const payload = {
        sites: [mappedSite],
        searchTerm: request.query || "software engineer",
        location: request.location || "India",
        resultsWanted: 100, // Fetch more to ensure we get enough after any filtering
        hoursOld: request.postedWithinHours || 48,
        offset: request.page ? (request.page - 1) * (request.limit || 20) : 0,
        isRemote: false, // Could be parsed from request if supported
        countryIndeed: "India"
      };

      const response = await axios.post(`${JOBSPY_SIDECAR_URL}/scrape`, payload, {
        timeout: 60000 // Scrapes can take a while
      });

      const data = response.data;
      
      const siteMeta = data.sites?.find((s: any) => s.site === mappedSite);
      
      if (siteMeta) {
        if (siteMeta.status === "rate_limited") stoppedReason = "RATE_LIMIT";
        else if (siteMeta.status === "blocked") stoppedReason = "CAPTCHA";
        else if (siteMeta.status === "empty") stoppedReason = "NO_RESULTS";
        else if (siteMeta.status === "timeout") stoppedReason = "ERROR";
      }

      if (data.jobs && Array.isArray(data.jobs)) {
        for (const job of data.jobs) {
          if (job.site.toLowerCase() !== mappedSite) continue;
          totalFetched++;

          jobs.push({
            id: job.id || randomUUID(),
            title: job.title || "Unknown Title",
            companyName: job.company || "Unknown Company",
            location: job.location || (job.city && job.state ? `${job.city}, ${job.state}` : "Remote"),
            description: job.description || "",
            url: job.job_url || job.job_url_direct || "",
            applyUrl: job.job_url || job.job_url_direct || "",
            postedAt: job.date_posted, 
            salaryText: (job.min_amount && job.max_amount) ? `${job.min_amount} - ${job.max_amount} ${job.currency}` : undefined,
            workMode: job.is_remote ? "REMOTE" : "ON-SITE",
            employmentType: job.job_type,
            skills: job.skills ? job.skills.split(",") : [],
            isIndiaJob: true,
            country: "India",
            sourceJobId: job.id,
            rawJson: job
          });
        }
      }

      if (jobs.length === 0 && !stoppedReason) {
        stoppedReason = "NO_RESULTS";
      }

    } catch (err: any) {
      console.error(`[JobSpyAdapter:${this.source}] Scraping failed:`, err.message);
      stoppedReason = "ERROR";
    }

    return {
      jobs,
      hasNextPage: jobs.length >= (request.limit || 20) && stoppedReason !== "NO_RESULTS",
      totalFetched,
      stoppedReason
    };
  }
}
