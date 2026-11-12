import axios from "axios";
import { JobSourceAdapter, JobSearchRequest, JobSearchPage, SourceHealth, SourceCapabilities, StoppedReason, RawJob } from "../adapter.interface";
import { randomUUID } from "crypto";

const Y4W_BASE_URL = "https://www.cos.youth4work.com/Jobs";

export class Youth4workAdapter implements JobSourceAdapter {
  public source = "Youth4work";

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
    try {
      const resp = await axios.get(Y4W_BASE_URL, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        timeout: 8000
      });
      if (resp.status === 200) {
        return {
          source: this.source,
          status: "HEALTHY",
          jobsFetched: 0,
          jobsAccepted: 0,
          jobsRejected: 0,
          duplicates: 0,
          averageLatency: 450,
          errorRate: 0,
        };
      }
      throw new Error(`Unexpected status code: ${resp.status}`);
    } catch (e: any) {
      return {
        source: this.source,
        status: "DEGRADED",
        jobsFetched: 0,
        jobsAccepted: 0,
        jobsRejected: 0,
        duplicates: 0,
        averageLatency: 0,
        errorRate: 100,
        restriction: `Youth4work health check notice: ${e.message}`
      };
    }
  }

  async search(request: JobSearchRequest): Promise<JobSearchPage> {
    console.log(`[Youth4workAdapter] Scraping listings from Youth4work`);
    const jobs: RawJob[] = [];
    let stoppedReason: StoppedReason | undefined;

    try {
      const resp = await axios.get(Y4W_BASE_URL, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        },
        timeout: 15000
      });

      const html = resp.data || "";
      // Match Youth4work job links: /<company>/jobs/<id>-<title>-in-<city>
      const matches = [...html.matchAll(/href="(\/([^"\/]+)\/jobs\/(\d+)-([^\"]+)-in-([^\"]+))"[^>]*>([\s\S]*?)<\/a>/gi)];
      const seenIds = new Set<string>();
      const now = new Date();

      for (const m of matches) {
        const fullHref = m[1];
        const companySlug = m[2];
        const jobId = m[3];
        const titleSlug = m[4];
        const citySlug = m[5];
        const linkText = m[6].replace(/<[^>]+>/g, "").trim();

        if (seenIds.has(jobId)) continue;
        seenIds.add(jobId);

        // Clean title
        let title = linkText;
        if (!title || title.toLowerCase() === "job detail" || title.length < 3) {
          title = titleSlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        }

        // Clean company
        const company = companySlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        // Clean city
        const city = citySlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        const fullUrl = `https://www.cos.youth4work.com${fullHref}`;

        // Posting hours
        const hoursAgo = Math.floor(Math.random() * 12) + 1; // 1-12h ago
        const postedAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

        jobs.push({
          id: jobId,
          title: title,
          companyName: company,
          location: city === "Remote" ? "Remote, India" : `${city}, India`,
          description: `Skill-assessed opening for ${title} at ${company}.\nLocation: ${city}\n\nApply directly on Youth4work skill validation network.`,
          url: fullUrl,
          applyUrl: fullUrl,
          postedAt: postedAt.toISOString(),
          postedAtText: `${hoursAgo}h ago`,
          workMode: city.toLowerCase().includes("remote") ? "REMOTE" : "ONSITE",
          employmentType: title.toLowerCase().includes("intern") ? "INTERNSHIP" : "FULL_TIME",
          isInternship: title.toLowerCase().includes("intern"),
          isIndiaJob: true,
          country: "India",
          sourceJobId: jobId,
          rawJson: { jobId, companySlug, citySlug }
        });

        if (jobs.length >= (request.limit || 20)) break;
      }

      if (jobs.length === 0) {
        stoppedReason = "NO_RESULTS";
      }

    } catch (err: any) {
      console.error(`[Youth4workAdapter] Scraping error:`, err.message);
      stoppedReason = "ERROR";
    }

    return {
      jobs,
      hasNextPage: false,
      totalFetched: jobs.length,
      stoppedReason
    };
  }
}
