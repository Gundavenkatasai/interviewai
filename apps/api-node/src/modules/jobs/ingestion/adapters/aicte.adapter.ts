import axios from "axios";
import { JobSourceAdapter, JobSearchRequest, JobSearchPage, SourceHealth, SourceCapabilities, StoppedReason, RawJob } from "../adapter.interface";
import { randomUUID } from "crypto";

const AICTE_API_BASE = "https://internship.aicte-india.org/api/v1/catalogue/internships";

export class AicteAdapter implements JobSourceAdapter {
  public source = "AICTE Internship";

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
      const resp = await axios.get(`${AICTE_API_BASE}?sort=best&page=1&pageSize=1`, {
        headers: { "Accept": "application/json" },
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
        restriction: `AICTE API check notice: ${e.message}`
      };
    }
  }

  async search(request: JobSearchRequest): Promise<JobSearchPage> {
    const pageNum = request.page || 1;
    const perPage = request.limit || 20;
    const query = request.query ? `&q=${encodeURIComponent(request.query)}` : "";
    const targetUrl = `${AICTE_API_BASE}?sort=best&page=${pageNum}&pageSize=${perPage}${query}`;

    console.log(`[AicteAdapter] Fetching opportunities from AICTE Internship Portal: page ${pageNum}`);
    const jobs: RawJob[] = [];
    let stoppedReason: StoppedReason | undefined;

    try {
      const resp = await axios.get(targetUrl, {
        headers: {
          "Accept": "application/json, text/plain, */*",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        timeout: 12000
      });

      const items = resp.data?.items || [];
      const now = new Date();

      for (const item of items) {
        const title = (item.title || "Government / Corporate Intern").trim();
        const companyName = (item.organization || "AICTE National Portal Partner").trim();
        const uid = item.uid || item.id;
        const publicUrl = `https://internship.aicte-india.org/internships/${uid}`;
        const isRemote = (item.mode || "").toLowerCase().includes("remote") || (item.mode || "").toLowerCase().includes("online");
        const location = isRemote ? "Remote, India" : (item.location ? `${item.location}` : (item.district ? `${item.district}, ${item.state || 'India'}` : "India"));

        // Posting date
        let postedAt = now;
        if (item.postedDate) {
          const parsed = new Date(item.postedDate);
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

        // Perks and description formatting
        const perks = Array.isArray(item.perks) ? item.perks.join(" • ") : "";
        const description = [
          item.description || `Internship opening for ${title} under AICTE National Portal.`,
          perks ? `Key Benefits & Credits: ${perks}` : "",
          item.stipendDisplay ? `Stipend: ${item.stipendDisplay}` : (item.stipend ? `Stipend: ₹${item.stipend}/mo` : "Stipend: As per AICTE norms"),
          `Category: ${item.category || "Government / Corporate"}`,
          `Apply directly on AICTE National Internship Portal.`
        ].filter(Boolean).join("\n\n");

        jobs.push({
          id: String(uid || randomUUID()),
          title: title,
          companyName: companyName,
          location: location,
          description: description,
          url: publicUrl,
          applyUrl: publicUrl,
          salaryText: item.stipendDisplay || (item.stipend ? `₹${item.stipend}/mo` : undefined),
          postedAt: postedAt.toISOString(),
          postedAtText: postedAtText,
          workMode: isRemote ? "REMOTE" : "ONSITE",
          employmentType: "INTERNSHIP",
          isInternship: true,
          isIndiaJob: true,
          country: "India",
          sourceJobId: String(uid || randomUUID()),
          rawJson: { aicte_id: uid, category: item.category, perks: item.perks }
        });
      }

      if (jobs.length === 0) {
        stoppedReason = "NO_RESULTS";
      }

    } catch (err: any) {
      console.error(`[AicteAdapter] Fetch error:`, err.message);
      stoppedReason = "ERROR";
    }

    return {
      jobs,
      hasNextPage: jobs.length >= perPage,
      totalFetched: jobs.length,
      stoppedReason
    };
  }
}

