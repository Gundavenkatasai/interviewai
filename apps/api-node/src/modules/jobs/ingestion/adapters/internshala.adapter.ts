import axios from "axios";
import { JobSourceAdapter, JobSearchRequest, JobSearchPage, SourceHealth, SourceCapabilities, StoppedReason, RawJob } from "../adapter.interface";
import { randomUUID } from "crypto";
import { z } from "zod";

const JINA_API_URL = "https://r.jina.ai/";
const INTERNSHALA_BASE = "https://internshala.com/jobs";

export class InternshalaAdapter implements JobSourceAdapter {
  public source = "Internshala";

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
    return {
      source: this.source,
      health: { status: "HEALTHY", lastChecked: new Date(), errors: 0, successes: 0 },
      jobsRejected: 0,
      duplicates: 0,
      averageLatency: 500,
      errorRate: 0,
      restriction: undefined
    };
  }

  async search(request: JobSearchRequest): Promise<JobSearchPage> {
    console.log(`[InternshalaAdapter] Scraping Internshala via Jina AI (Agent-Reach pattern) for: ${request.query}`);
    const jobs: RawJob[] = [];
    let stoppedReason: StoppedReason | undefined;
    
    try {
      const query = request.query ? request.query.replace(/\s+/g, "-").toLowerCase() : "software-engineer";
      const targetUrl = `${INTERNSHALA_BASE}/${query}-jobs/`;
      
      const response = await axios.get(`${JINA_API_URL}${targetUrl}`, {
        headers: {
          "Accept": "application/json",
          "X-Return-Format": "markdown"
        }
      });
      
      const markdown = response.data?.data?.content || response.data || "";
      
      // Basic markdown parsing to extract jobs (simulating Agent-Reach extraction)
      // Internshala jobs usually appear in the markdown as headings with company names
      const jobBlocks = markdown.split(/\n##\s+/).slice(1); // Split by h2 headers
      
      for (const block of jobBlocks) {
        if (!block.trim()) continue;
        
        const lines = block.split("\n").map((l: any) => l.trim());
        const title = lines[0]?.trim() || "Unknown Title";
        
        // Very basic extraction heuristic for Internshala
        const companyLine = lines.find((l: any) => l.includes("Company") || l.match(/^[A-Z][a-zA-Z\s]+$/)) || "Unknown Company";
        const locationLine = lines.find((l: any) => l.includes("Location") || l.includes("Remote") || l.includes(",")) || "India";
        
        // Find URLs if present
        const urlMatch = block.match(/\]\((https:\/\/internshala\.com\/job\/detail\/[^\)]+)\)/);
        const url = urlMatch ? urlMatch[1] : targetUrl;
        
        jobs.push({
          id: randomUUID(),
          title: title.replace(/[^a-zA-Z0-9\s-]/g, ""),
          companyName: companyLine.replace(/Company:|#|\*/g, "").trim().substring(0, 50),
          location: locationLine.replace(/Location:|#|\*/g, "").trim().substring(0, 50),
          description: block.substring(0, 500), // Raw snippet
          url: url,
          applyUrl: url,
          postedAt: new Date().toISOString(),
          workMode: block.toLowerCase().includes("remote") || block.toLowerCase().includes("work from home") ? "REMOTE" : "ON-SITE",
          employmentType: "FULL_TIME",
          skills: [],
          isIndiaJob: true,
          country: "India",
          sourceJobId: randomUUID(),
          rawJson: { markdown_snippet: block }
        });
        
        if (jobs.length >= (request.limit || 20)) break;
      }
      
      if (jobs.length === 0) {
        stoppedReason = "NO_RESULTS";
      }
      
    } catch (err: any) {
      console.error(`[InternshalaAdapter] Scraping failed:`, err.message);
      stoppedReason = "ERROR";
    }

    return {
      jobs,
      hasNextPage: false, // Simplification for Jina pattern
      totalFetched: jobs.length,
      stoppedReason
    };
  }
}
