import { JobSourceAdapter, JobSearchRequest, JobSearchPage, RawJob, SourceHealth, SourceCapabilities } from "../adapter.interface";

export class WorkableAdapter implements JobSourceAdapter {
  public source = "Workable";

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
      errorRate: 0,
    };
  }

  async search(request: JobSearchRequest): Promise<JobSearchPage> {
    const rawCompany = request.companyName?.toLowerCase() || "canonical";
    const company = rawCompany.replace(/[^a-z0-9-]/g, "");
    const url = `https://apply.workable.com/api/v1/widget/accounts/${company}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, { signal: controller.signal as any });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) return { jobs: [], hasNextPage: false, totalFetched: 0 };
        throw new Error(`Workable API error: ${response.status}`);
      }

      const data = await response.json() as any;
      const list = data?.jobs || [];
      const jobs: RawJob[] = list.map((item: any) => ({
        source: this.source,
        externalId: String(item.shortcode || item.id),
        title: item.title || "Software Engineer",
        company: data.name || company,
        location: [item.city, item.region, item.country].filter(Boolean).join(", ") || (item.telecommuting ? "Remote" : "India"),
        description: item.description || item.title || "",
        applyUrl: item.url || `https://apply.workable.com/${company}/j/${item.shortcode}/`,
        postedAt: item.created_at ? new Date(item.created_at) : new Date(),
        skills: item.department ? [item.department] : ["Software Engineering"],
        experienceLevel: item.experience || "Entry-Level",
        workMode: item.telecommuting ? "REMOTE" : "HYBRID",
        employmentType: item.employment_type || "Full-Time",
      }));

      return {
        jobs,
        hasNextPage: false,
        totalFetched: jobs.length,
      };
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new Error("Workable API timed out after 10000ms");
      }
      return { jobs: [], hasNextPage: false, totalFetched: 0 };
    }
  }
}
