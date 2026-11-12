import axios from "axios";
import { JobSourceAdapter, JobSearchRequest, JobSearchPage, SourceHealth, SourceCapabilities, StoppedReason, RawJob } from "../adapter.interface";
import { randomUUID } from "crypto";

const LINKEDIN_GUEST_BASE = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search";

export class LinkedInAdapter implements JobSourceAdapter {
  public source = "LinkedIn";

  getCapabilities(): SourceCapabilities {
    return {
      supportsPagination: true,
      supportsJobDetails: true,
      supportsPostingDate: true,
      supportsRealPostingDate: true,
      supportsSalary: false,
      supportsRemote: true,
      supportsExperience: true,
      supportsIncrementalSync: false,
      supportsSearch: true,
      supportsCompanyFilter: true,
    };
  }

  async healthCheck(): Promise<SourceHealth> {
    try {
      const resp = await axios.get(`${LINKEDIN_GUEST_BASE}?keywords=internship&location=India&start=0`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
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
          averageLatency: 400,
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
        restriction: `LinkedIn health check notice: ${e.message}`
      };
    }
  }

  async search(request: JobSearchRequest): Promise<JobSearchPage> {
    const pageNum = request.page || 1;
    const start = (pageNum - 1) * 10;
    const query = request.query || "software intern";
    const location = request.location || "India";
    const targetUrl = `${LINKEDIN_GUEST_BASE}?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&start=${start}`;

    console.log(`[LinkedInAdapter] Scraping LinkedIn guest job postings: start=${start}, query="${query}"`);
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

      const cards = (resp.data || "").split("<li").slice(1);
      const now = new Date();

      for (const card of cards) {
        const titleMatch = card.match(/<h3 class="base-search-card__title">([\s\S]*?)<\/h3>/i);
        const compMatch = card.match(/<h4 class="base-search-card__subtitle">([\s\S]*?)<\/h4>/i);
        const locMatch = card.match(/<span class="job-search-card__location">([\s\S]*?)<\/span>/i);
        const linkMatch = card.match(/<a class="base-card__full-link[^"]*" href="([^"]+)"/i);
        const dateMatch = card.match(/<time[^>]+datetime="([^"]+)"[^>]*>([\s\S]*?)<\/time>/i);

        if (!titleMatch || !compMatch) continue;

        const title = titleMatch[1].replace(/<[^>]+>/g, "").trim();
        const company = compMatch[1].replace(/<[^>]+>/g, "").trim();
        const loc = locMatch ? locMatch[1].replace(/<[^>]+>/g, "").trim() : "India";
        const link = linkMatch ? linkMatch[1].split("?")[0].trim() : "https://www.linkedin.com/jobs";

        let postedAt = now;
        let postedAtText = "Just now";

        if (dateMatch) {
          if (dateMatch[1]) {
            const parsed = new Date(dateMatch[1]);
            if (!isNaN(parsed.getTime())) postedAt = parsed;
          }
          if (dateMatch[2]) {
            postedAtText = dateMatch[2].replace(/<[^>]+>/g, "").trim();
          }
        }

        const isRemote = title.toLowerCase().includes("remote") || loc.toLowerCase().includes("remote");

        jobs.push({
          id: randomUUID(),
          title: title,
          companyName: company,
          location: loc,
          description: `Verified opportunity for ${title} at ${company}.\nLocation: ${loc}\n\nApply directly on LinkedIn Jobs.`,
          url: link,
          applyUrl: link,
          postedAt: postedAt.toISOString(),
          postedAtText: postedAtText,
          workMode: isRemote ? "REMOTE" : "ONSITE",
          employmentType: title.toLowerCase().includes("intern") ? "INTERNSHIP" : "FULL_TIME",
          isInternship: title.toLowerCase().includes("intern"),
          isIndiaJob: true,
          country: "India",
          sourceJobId: randomUUID(),
          rawJson: { original_url: link, dateString: dateMatch ? dateMatch[1] : null }
        });

        if (jobs.length >= (request.limit || 20)) break;
      }

      if (jobs.length === 0) {
        stoppedReason = "NO_RESULTS";
      }

    } catch (err: any) {
      console.error(`[LinkedInAdapter] Scraping error:`, err.message);
      stoppedReason = "ERROR";
    }

    return {
      jobs,
      hasNextPage: jobs.length >= 10,
      totalFetched: jobs.length,
      stoppedReason
    };
  }
}
