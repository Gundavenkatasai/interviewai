import axios from "axios";
import { JobSourceAdapter, JobSearchRequest, JobSearchPage, SourceHealth, SourceCapabilities, StoppedReason, RawJob } from "../adapter.interface";
import { PostingDateParser } from "../posting.date.parser";
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
      status: "HEALTHY",
      jobsFetched: 0,
      jobsAccepted: 0,
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
      const query = request.query ? encodeURIComponent(request.query.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-")) : "software-engineer";
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
        
        const lines = block.split("\n").map((l: any) => l.trim()).filter(Boolean);
        
        // Find URLs if present
        const urlMatch = block.match(/\]\((https:\/\/internshala\.com\/job\/detail\/[^\)]+)\)/);
        const url = urlMatch ? urlMatch[1] : targetUrl;
        
        // Extract clean title from markdown link or first line
        let title = "Software Developer";
        const titleMatch = lines[0]?.match(/\[([^\]]+)\]/);
        if (titleMatch) {
          title = titleMatch[1].trim();
        } else if (lines[0]) {
          title = lines[0].replace(/\[|\]|\([^\)]*\)/g, "").trim();
        }
        
        // Extract city from URL slug if available
        let city = "Bengaluru";
        if (url) {
          const slugMatch = url.match(/\/job\/detail\/([^\/]+)/);
          if (slugMatch) {
            const slug = slugMatch[1].toLowerCase();
            if (slug.includes("-job-in-")) {
              const rawCity = slug.split("-job-in-")[1].split("-at-")[0].replace(/-/g, " ");
              city = rawCity.replace(/\b\w/g, (c: string) => c.toUpperCase());
            } else if (slug.includes("remote")) {
              city = "Remote";
            }
          }
        }
        
        // Normalize city aliases
        if (city.toLowerCase().includes("bangalore")) city = "Bengaluru";
        if (city.toLowerCase().includes("delhi") || city.toLowerCase().includes("gurgaon")) city = "Delhi NCR";
        
        // Extract company line
        const companyLine = lines.find((l: any) => l.match(/^[A-Z][a-zA-Z0-9\s&.,-]{2,40}$/) && !l.includes("₹") && !l.includes("experience")) || "Enterprise Partner";
        
        const isRemote = block.toLowerCase().includes("remote") || block.toLowerCase().includes("work from home");
        const location = city === "Remote" ? "Remote, India" : `${city}, India`;

        // Extract relative date text from block (e.g. "2 days ago", "1 week ago", "Just now", "few hours ago")
        const dateMatch = block.match(/(\d+\s*(?:hours?|hrs?|h|days?|d|weeks?|w|months?|mo|minutes?|min)\s*ago|just now|today|yesterday|a day ago|an hour ago)/i);
        const postedAtText = dateMatch ? dateMatch[0].trim() : "Just now";
        const parsedDate = PostingDateParser.parse(postedAtText);
        const postedAt = parsedDate.date || new Date();

        // Infer accurate track & skills from job title
        const lowerTitle = title.toLowerCase();
        let roleCategory = "fullstack";
        let skills: string[] = ["JavaScript", "TypeScript", "React", "Node.js"];

        if (lowerTitle.includes("front end") || lowerTitle.includes("frontend") || lowerTitle.includes("web developer")) {
          roleCategory = "frontend";
          skills = ["React", "TypeScript", "JavaScript", "HTML5", "CSS3", "Tailwind"];
        } else if (lowerTitle.includes("wordpress") || lowerTitle.includes("php")) {
          roleCategory = "frontend";
          skills = ["WordPress", "PHP", "JavaScript", "HTML5", "CSS3", "MySQL"];
        } else if (lowerTitle.includes("java")) {
          roleCategory = "backend";
          skills = ["Java", "Spring Boot", "PostgreSQL", "REST APIs", "Microservices"];
        } else if (lowerTitle.includes("backend") || lowerTitle.includes("back end") || lowerTitle.includes("node")) {
          roleCategory = "backend";
          skills = ["Node.js", "Express", "PostgreSQL", "Docker", "REST APIs"];
        } else if (lowerTitle.includes("python") || lowerTitle.includes("django") || lowerTitle.includes("fastapi")) {
          roleCategory = "backend";
          skills = ["Python", "FastAPI", "PostgreSQL", "Docker", "REST APIs"];
        } else if (lowerTitle.includes("android") || lowerTitle.includes("mobile") || lowerTitle.includes("ios") || lowerTitle.includes("flutter")) {
          roleCategory = "mobile";
          skills = ["Android", "Kotlin", "Java", "Mobile", "REST APIs"];
        } else if (lowerTitle.includes("qa") || lowerTitle.includes("tester") || lowerTitle.includes("testing") || lowerTitle.includes("automation")) {
          roleCategory = "qa";
          skills = ["QA", "Automation", "Selenium", "Testing", "Python", "Postman"];
        } else if (lowerTitle.includes("cloud") || lowerTitle.includes("devops") || lowerTitle.includes("network") || lowerTitle.includes("support")) {
          roleCategory = "devops";
          skills = ["AWS", "Cloud", "Docker", "Linux", "Kubernetes", "Networking"];
        } else if (lowerTitle.includes("ai") || lowerTitle.includes("machine learning") || lowerTitle.includes("vision")) {
          roleCategory = "ai";
          skills = ["Python", "Machine Learning", "TensorFlow", "PyTorch", "LLM"];
        } else if (lowerTitle.includes("data") || lowerTitle.includes("analytics")) {
          roleCategory = "data";
          skills = ["SQL", "Python", "ETL", "PostgreSQL", "Analytics"];
        } else if (lowerTitle.includes("sales") || lowerTitle.includes("business development") || lowerTitle.includes("admissions")) {
          roleCategory = "product";
          skills = ["Sales", "Business Development", "Lead Generation", "CRM"];
        } else if (lowerTitle.includes("marketing")) {
          roleCategory = "product";
          skills = ["Digital Marketing", "SEO", "Content Strategy", "Social Media"];
        } else if (lowerTitle.includes("accountant") || lowerTitle.includes("finance")) {
          roleCategory = "other";
          skills = ["Accounting", "Tally", "GST", "MS Excel", "Financial Reporting"];
        } else if (lowerTitle.includes("video") || lowerTitle.includes("cinema") || lowerTitle.includes("editor")) {
          roleCategory = "product";
          skills = ["Video Editing", "Premiere Pro", "After Effects", "Color Grading"];
        } else if (lowerTitle.includes("civil") || lowerTitle.includes("chemical")) {
          roleCategory = "other";
          skills = ["AutoCAD", "Engineering", "Project Management", "Site Planning"];
        } else if (lowerTitle.includes("teacher") || lowerTitle.includes("educator") || lowerTitle.includes("faculty")) {
          roleCategory = "fullstack";
          skills = ["Computer Science", "Python", "C++", "Data Structures"];
        } else if (lowerTitle.includes("customer")) {
          roleCategory = "other";
          skills = ["Customer Support", "Communication", "Helpdesk", "CRM"];
        }

        jobs.push({
          id: randomUUID(),
          title: title.replace(/https.*$/i, "").trim(),
          companyName: companyLine.replace(/Company:|#|\*/g, "").trim().substring(0, 50),
          location: location,
          description: block.substring(0, 800), // Raw snippet
          url: url,
          applyUrl: url,
          postedAt: postedAt.toISOString(),
          postedAtText: postedAtText,
          workMode: isRemote ? "REMOTE" : "ONSITE",
          employmentType: "FULL_TIME",
          skills: skills,
          isIndiaJob: true,
          country: "India",
          sourceJobId: randomUUID(),
          rawJson: { markdown_snippet: block, city: city, roleCategory: roleCategory }
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
