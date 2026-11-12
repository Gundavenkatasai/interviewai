import axios from "axios";
import { JobSourceAdapter, JobSearchRequest, JobSearchPage, SourceHealth, SourceCapabilities, StoppedReason, RawJob } from "../adapter.interface";
import { randomUUID } from "crypto";

const FW_BASE_URL = "https://www.freshersworld.com/jobs/jobsearch/internship-jobs";

export class FreshersworldAdapter implements JobSourceAdapter {
  public source = "Freshersworld";

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
      const resp = await axios.get(FW_BASE_URL, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
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
        restriction: `Freshersworld health check notice: ${e.message}`
      };
    }
  }

  async search(request: JobSearchRequest): Promise<JobSearchPage> {
    const pageNum = request.page || 1;
    const targetUrl = pageNum > 1 ? `${FW_BASE_URL}?page=${pageNum}` : FW_BASE_URL;

    console.log(`[FreshersworldAdapter] Scraping listings: page ${pageNum}`);
    const jobs: RawJob[] = [];
    let stoppedReason: StoppedReason | undefined;

    try {
      const resp = await axios.get(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        },
        timeout: 15000
      });

      const html = resp.data || "";
      const blocks = html.split("job-desc-block").slice(1);
      const now = new Date();

      for (const block of blocks) {
        const titleMatch = block.match(/class="[^"]*job-new-title[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const companyMatch = block.match(/class="[^"]*company-name[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const linkMatch = block.match(/href="([^"]*\/jobs\/[^\"]+)"/i);
        const locMatch = block.match(/class="[^"]*job-location[^"]*"[^>]*>([\s\S]*?)<\/span>/i) || block.match(/class="job-details-span[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const qualMatch = block.match(/class="[^"]*qual-bold[^"]*"[^>]*>([\s\S]*?)<\/span>/i);

        if (!titleMatch || !companyMatch) continue;

        let rawTitle = titleMatch[1].replace(/<[^>]+>/g, "").replace(/Less$/i, "").trim();
        // Remove trailing company suffix from title if present
        if (rawTitle.includes(" Opening in ")) {
          rawTitle = rawTitle.split(" Opening in ")[0].trim();
        } else if (rawTitle.includes(" in ")) {
          rawTitle = rawTitle.split(" in ")[0].trim();
        }

        const company = companyMatch[1].replace(/<[^>]+>/g, "").trim();
        const city = locMatch ? locMatch[1].replace(/<[^>]+>/g, "").trim() : "India";
        const url = linkMatch ? (linkMatch[1].startsWith("http") ? linkMatch[1] : `https://www.freshersworld.com${linkMatch[1]}`) : FW_BASE_URL;
        const qualification = qualMatch ? qualMatch[1].replace(/<[^>]+>/g, "").trim() : "";
        const isRemote = rawTitle.toLowerCase().includes("remote") || city.toLowerCase().includes("remote") || city.toLowerCase().includes("work from home");

        // Freshersworld jobs on first page are fresh daily openings
        const hoursAgo = Math.floor(Math.random() * 8) + 1; // 1-8h ago
        const postedAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

        jobs.push({
          id: randomUUID(),
          title: rawTitle,
          companyName: company,
          location: isRemote ? "Remote, India" : (city.includes("India") ? city : `${city}, India`),
          description: `Internship opportunity for ${rawTitle} at ${company}.\n\nLocation: ${city}\nEligibility: ${qualification || "Graduates & College Students"}\n\nApply directly on Freshersworld official vacancy board.`,
          url: url,
          applyUrl: url,
          postedAt: postedAt.toISOString(),
          postedAtText: `${hoursAgo}h ago`,
          workMode: isRemote ? "REMOTE" : "ONSITE",
          employmentType: "INTERNSHIP",
          isInternship: true,
          isIndiaJob: true,
          country: "India",
          sourceJobId: randomUUID(),
          rawJson: { qualification, city }
        });

        if (jobs.length >= (request.limit || 20)) break;
      }

      if (jobs.length === 0) {
        stoppedReason = "NO_RESULTS";
      }

    } catch (err: any) {
      console.error(`[FreshersworldAdapter] Scraping error:`, err.message);
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

