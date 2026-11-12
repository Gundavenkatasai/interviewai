import axios from "axios";
import { JobSourceAdapter, JobSearchRequest, JobSearchPage, SourceHealth, SourceCapabilities, StoppedReason, RawJob } from "../adapter.interface";
import { PostingDateParser } from "../posting.date.parser";
import { randomUUID } from "crypto";

const UNSTOP_API_BASE = "https://unstop.com/api/public/opportunity/search-result";

export class UnstopAdapter implements JobSourceAdapter {
  public source = "Unstop";

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
      const resp = await axios.get(`${UNSTOP_API_BASE}?opportunity=internships&per_page=1`, {
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
          averageLatency: 350,
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
        restriction: `Unstop API check notice: ${e.message}`
      };
    }
  }

  async search(request: JobSearchRequest): Promise<JobSearchPage> {
    const pageNum = request.page || 1;
    const perPage = request.limit || 20;
    const query = request.query ? `&searchTerm=${encodeURIComponent(request.query)}` : "";
    const targetUrl = `${UNSTOP_API_BASE}?opportunity=internships&per_page=${perPage}&page=${pageNum}${query}`;

    console.log(`[UnstopAdapter] Fetching opportunities from Unstop: page ${pageNum}`);
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

      const items = resp.data?.data?.data || [];
      const now = new Date();

      for (const item of items) {
        const title = (item.title || "Internship Opportunity").trim();
        const companyName = (item.organisation?.name || item.organisation_name || item.subtitle || "Enterprise Partner").trim();
        const publicUrl = item.public_url ? `https://unstop.com/${item.public_url}` : "https://unstop.com/internships";
        const isRemote = (item.region || "").toLowerCase().includes("online") || (item.region || "").toLowerCase().includes("remote");
        const location = isRemote ? "Remote, India" : (item.locations?.[0]?.city ? `${item.locations[0].city}, India` : "India");

        // Extract posted / updated timestamp
        let postedAt = now;
        if (item.updated_at) {
          const parsed = new Date(item.updated_at);
          if (!isNaN(parsed.getTime())) postedAt = parsed;
        } else if (item.start_date) {
          const parsed = new Date(item.start_date);
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

        // Eligibility / filters summary
        const filtersList = Array.isArray(item.filters) ? item.filters.map((f: any) => f.name).filter(Boolean) : [];
        const description = [
          item.seo_details?.description || item.description || `Internship opening for ${title} at ${companyName}.`,
          filtersList.length > 0 ? `Eligible Candidates: ${filtersList.join(", ")}.` : "",
          `Apply directly on Unstop portal.`
        ].filter(Boolean).join("\n\n");

        jobs.push({
          id: String(item.id || randomUUID()),
          title: title,
          companyName: companyName,
          location: location,
          description: description,
          url: publicUrl,
          applyUrl: publicUrl,
          postedAt: postedAt.toISOString(),
          postedAtText: postedAtText,
          workMode: isRemote ? "REMOTE" : "ONSITE",
          employmentType: "INTERNSHIP",
          isInternship: true,
          isIndiaJob: true,
          country: "India",
          sourceJobId: String(item.id || randomUUID()),
          rawJson: { unstop_id: item.id, filters: filtersList }
        });
      }

      if (jobs.length === 0) {
        stoppedReason = "NO_RESULTS";
      }

    } catch (err: any) {
      console.error(`[UnstopAdapter] Fetch error:`, err.message);
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

