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
import { UnstopAdapter } from "./adapters/unstop.adapter";
import { AicteAdapter } from "./adapters/aicte.adapter";
import { FreshersworldAdapter } from "./adapters/freshersworld.adapter";
import { LetsInternAdapter } from "./adapters/letsintern.adapter";
import { Youth4workAdapter } from "./adapters/youth4work.adapter";
import { FounditZunoAdapter } from "./adapters/founditzuno.adapter";
import { NaukriCampusAdapter } from "./adapters/naukricampus.adapter";
import { GlassdoorAdapter } from "./adapters/glassdoor.adapter";
import { IndeedAdapter } from "./adapters/indeed.adapter";
import { GreenhouseAdapter } from "./adapters/greenhouse.adapter";
import { LeverAdapter } from "./adapters/lever.adapter";
import { AshbyAdapter } from "./adapters/ashby.adapter";
import { SmartRecruitersAdapter } from "./adapters/smartrecruiters.adapter";
import { WorkableAdapter } from "./adapters/workable.adapter";

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
    // Official ATS & Direct Company Feeds
    this.register(new GreenhouseAdapter());
    this.register(new LeverAdapter());
    this.register(new AshbyAdapter());
    this.register(new SmartRecruitersAdapter());
    this.register(new WorkableAdapter());

    // Specialized Native Sources
    this.register(new LinkedInAdapter());
    this.register(new NaukriAdapter());
    this.register(new NaukriCampusAdapter());
    this.register(new IndeedAdapter());
    this.register(new GlassdoorAdapter());
    this.register(new FounditAdapter());
    this.register(new TimesJobsAdapter());
    this.register(new InternshalaAdapter());
    this.register(new UnstopAdapter());
    this.register(new AicteAdapter());
    this.register(new FreshersworldAdapter());
    this.register(new LetsInternAdapter());
    this.register(new Youth4workAdapter());
    this.register(new FounditZunoAdapter());
    this.register(new WellfoundAdapter());
    this.register(new CutshortAdapter());
    this.register(new HiristAdapter());
    this.register(new ShineAdapter());

    // Fallback/Secondary Sources
    this.register(new JobSpyAdapter("GoogleJobs"));
    this.register(new JobSpyAdapter("ZipRecruiter"));
    this.register(new JobSpyAdapter("Bayt"));
    this.register(new JobSpyAdapter("BDJobs"));
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
