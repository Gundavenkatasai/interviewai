import axios from "axios";
import { JobSourceAdapter, JobSearchRequest, JobSearchPage, SourceHealth, SourceCapabilities, StoppedReason, RawJob } from "../adapter.interface";
import { randomUUID } from "crypto";

const LETSINTERN_BASE = "https://letsintern.in/category/internships/";

export class LetsInternAdapter implements JobSourceAdapter {
  public source = "LetsIntern";

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
      supportsCompanyFilter: false,
    };
  }

  async healthCheck(): Promise<SourceHealth> {
    try {
      const resp = await axios.get(LETSINTERN_BASE, {
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
        restriction: `LetsIntern health check notice: ${e.message}`
      };
    }
  }

  async search(request: JobSearchRequest): Promise<JobSearchPage> {
    const pageNum = request.page || 1;
    const targetUrl = pageNum > 1 ? `${LETSINTERN_BASE}page/${pageNum}/` : LETSINTERN_BASE;

    console.log(`[LetsInternAdapter] Scraping listings: page ${pageNum}`);
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
      const articles = [...html.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/gi)];
      const now = new Date();

      for (const article of articles) {
        const block = article[1];
        const titleMatch = block.match(/<h2[^>]*><a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/h2>/i);
        const excerptMatch = block.match(/<div class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) || block.match(/<p>([\s\S]*?)<\/p>/i);
        const dateMatch = block.match(/<time[^>]+datetime="([^"]+)"/i);

        if (!titleMatch) continue;

        const url = titleMatch[1];
        let title = titleMatch[2].replace(/<[^>]+>/g, "").replace(/&#038;/g, "&").replace(/&amp;/g, "&").trim();
        const excerpt = excerptMatch ? excerptMatch[1].replace(/<[^>]+>/g, "").trim().substring(0, 500) : "";

        // Parse date
        let postedAt = now;
        if (dateMatch && dateMatch[1]) {
          const parsed = new Date(dateMatch[1]);
          if (!isNaN(parsed.getTime())) postedAt = parsed;
        }

        const diffMinutes = Math.floor((now.getTime() - postedAt.getTime()) / (1000 * 60));
        let postedAtText = "Just now";
        if (diffMinutes >= 60 * 24) {
          postedAtText = `${Math.floor(diffMinutes / (60 * 24))}d ago`;
        } else if (diffMinutes >= 60) {
          postedAtText = `${Math.floor(diffMinutes / 60)}h ago`;
        } else if (diffMinutes >= 1) {
          postedAtText = `${diffMinutes}m ago`;
        }

        const isRemote = title.toLowerCase().includes("remote") || title.toLowerCase().includes("online") || excerpt.toLowerCase().includes("remote");

        jobs.push({
          id: randomUUID(),
          title: title,
          companyName: "LetsIntern Partner Network",
          location: isRemote ? "Remote, India" : "India",
          description: `${excerpt || title}\n\nStudent internship opportunity on LetsIntern portal.\nApply directly on the official program link.`,
          url: url,
          applyUrl: url,
          postedAt: postedAt.toISOString(),
          postedAtText: postedAtText,
          workMode: isRemote ? "REMOTE" : "HYBRID",
          employmentType: "INTERNSHIP",
          isInternship: true,
          isIndiaJob: true,
          country: "India",
          sourceJobId: randomUUID(),
          rawJson: { original_url: url }
        });

        if (jobs.length >= (request.limit || 20)) break;
      }

      if (jobs.length === 0) {
        stoppedReason = "NO_RESULTS";
      }

    } catch (err: any) {
      console.error(`[LetsInternAdapter] Scraping error:`, err.message);
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

