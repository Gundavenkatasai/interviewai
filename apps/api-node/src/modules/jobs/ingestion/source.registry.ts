import { JobSourceAdapter, SourceHealth } from "./adapter.interface";
import { JobSpyAdapter } from "./adapters/jobspy.adapter";
import { FounditAdapter } from "./adapters/foundit.adapter";
import { InternshalaAdapter } from "./adapters/internshala.adapter";
import { WellfoundAdapter } from "./adapters/wellfound.adapter";
import { CutshortAdapter } from "./adapters/cutshort.adapter";
import { HiristAdapter } from "./adapters/hirist.adapter";
import { ShineAdapter } from "./adapters/shine.adapter";
import { TimesJobsAdapter } from "./adapters/timesjobs.adapter";
import { LinkedInAdapter } from "./adapters/linkedin.adapter";
import { NaukriAdapter } from "./adapters/naukri.adapter";

export interface SourceInfo {
  key: string;
  label: string;
  provider: string;
  acquisitionMethod: string;
  enabled: boolean;
  supportsIndia: boolean;
  supportsRemote: boolean;
  supportsPagination: boolean;
  supportsKeywordSearch: boolean;
  supportsLocation: boolean;
  supportsJobType: boolean;
  supportsSalary: boolean;
  status: string;
}

export class JobSourceRegistry {
  private static instances: Map<string, JobSourceAdapter> = new Map();

  static {
    // JobSpy Sources (for platforms without native adapters)
    this.register(new JobSpyAdapter("Indeed"));
    this.register(new JobSpyAdapter("Glassdoor"));
    this.register(new JobSpyAdapter("GoogleJobs"));
    this.register(new JobSpyAdapter("ZipRecruiter"));
    this.register(new JobSpyAdapter("Bayt"));
    this.register(new JobSpyAdapter("BDJobs"));
    this.register(new JobSpyAdapter("LinkedIn")); // Switch LinkedIn to JobSpy

    // Specialized Native Sources
    // this.register(new LinkedInAdapter());
    this.register(new NaukriAdapter());
    this.register(new InternshalaAdapter());
    this.register(new FounditAdapter());
    this.register(new WellfoundAdapter());
    this.register(new CutshortAdapter());
    this.register(new HiristAdapter());
    this.register(new ShineAdapter());
    this.register(new TimesJobsAdapter());
    // ATS Integrations (Using a curated company list in the future)
    // this.register(new GreenhouseAdapter());
    // this.register(new LeverAdapter());
    // this.register(new AshbyAdapter());
  }

  static register(adapter: JobSourceAdapter) {
    this.instances.set(adapter.source.toLowerCase(), adapter);
  }

  static getAdapter(sourceName: string): JobSourceAdapter | undefined {
    return this.instances.get(sourceName.toLowerCase());
  }

  static getAllAdapters(): JobSourceAdapter[] {
    return Array.from(this.instances.values());
  }

  static async getHealthStatus(): Promise<Record<string, SourceHealth>> {
    const status: Record<string, SourceHealth> = {};
    const adapters = this.getAllAdapters();
    
    await Promise.all(
      adapters.map(async (adapter) => {
        try {
           const health = await adapter.healthCheck();
           status[adapter.source.toUpperCase()] = health;
        } catch (e: any) {
           status[adapter.source.toUpperCase()] = {
             source: adapter.source,
             status: "FAILING",
             jobsFetched: 0,
             jobsAccepted: 0,
             jobsRejected: 0,
             duplicates: 0,
             averageLatency: 0,
             errorRate: 100,
             restriction: `Health check failed: ${e.message}`
           };
        }
      })
    );

    return status;
  }

  static getCapabilitiesInfo(): SourceInfo[] {
    const jobspySources = ["LinkedIn", "Indeed", "Naukri", "Glassdoor", "GoogleJobs", "ZipRecruiter", "Bayt", "BDJobs"];
    const restrictedSources = ["Foundit", "Wellfound", "Cutshort", "Hirist", "Shine", "TimesJobs"];
    const info: SourceInfo[] = [];

    for (const adapter of this.getAllAdapters()) {
      const caps = adapter.getCapabilities();
      info.push({
        key: adapter.source.toUpperCase(),
        label: adapter.source === "GoogleJobs" ? "Google Jobs" : adapter.source,
        provider: jobspySources.includes(adapter.source) ? "JOBSPY" : "SPECIALIZED",
        acquisitionMethod: "API",
        enabled: true,
        supportsIndia: !["ZipRecruiter", "Bayt", "BDJobs"].includes(adapter.source),
        supportsRemote: caps.supportsRemote,
        supportsPagination: caps.supportsPagination,
        supportsKeywordSearch: caps.supportsSearch,
        supportsLocation: true,
        supportsJobType: true,
        supportsSalary: caps.supportsSalary,
        status: restrictedSources.includes(adapter.source) ? "restricted" : "active"
      });
    }
    return info;
  }
}
