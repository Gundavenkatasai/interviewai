import { JobSourceAdapter, JobSearchRequest, JobSearchPage, RawJob, SourceHealth, SourceCapabilities } from "../adapter.interface";

export class SmartRecruitersAdapter implements JobSourceAdapter {
  public source = "SmartRecruiters";

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
    const rawCompany = request.companyName?.toLowerCase() || "visa";
    const company = rawCompany.replace(/[^a-z0-9-]/g, "");
    const url = `https://api.smartrecruiters.com/v1/companies/${company}/postings?limit=25`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, { signal: controller.signal as any });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) return { jobs: [], hasNextPage: false, totalFetched: 0 };
        throw new Error(`SmartRecruiters API error: ${response.status}`);
      }

      const data = await response.json() as any;
      const content = data?.content || [];
      const jobs: RawJob[] = content.map((item: any) => ({
        source: this.source,
        externalId: String(item.id),
        title: item.name || "Software Engineer",
        company: item.company?.name || company,
        location: [item.location?.city, item.location?.region, item.location?.country].filter(Boolean).join(", ") || "Remote",
        description: item.jobAd?.sections?.jobDescription?.text || item.name || "",
        applyUrl: `https://jobs.smartrecruiters.com/${company}/${item.id}`,
        postedAt: item.releasedDate ? new Date(item.releasedDate) : new Date(),
        skills: item.industry?.label ? [item.industry.label] : ["Engineering"],
        experienceLevel: "Entry-Level",
        workMode: item.location?.remote ? "REMOTE" : "HYBRID",
        employmentType: item.typeOfEmployment?.label || "Full-Time",
      }));

      return {
        jobs,
        hasNextPage: false,
        totalFetched: jobs.length,
      };
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new Error("SmartRecruiters API timed out after 10000ms");
      }
      return { jobs: [], hasNextPage: false, totalFetched: 0 };
    }
  }
}
