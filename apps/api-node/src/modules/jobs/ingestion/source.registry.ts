import { JobSourceAdapter, SourceHealth } from "./adapter.interface";
import { NaukriAdapter } from "./adapters/naukri.adapter";
import { IndeedAdapter } from "./adapters/indeed.adapter";
import { FounditAdapter } from "./adapters/foundit.adapter";
import { InternshalaAdapter } from "./adapters/internshala.adapter";
import { WellfoundAdapter } from "./adapters/wellfound.adapter";
import { LinkedInAdapter } from "./adapters/linkedin.adapter";

import { CutshortAdapter } from "./adapters/cutshort.adapter";
import { HiristAdapter } from "./adapters/hirist.adapter";
import { ShineAdapter } from "./adapters/shine.adapter";
import { TimesJobsAdapter } from "./adapters/timesjobs.adapter";

export class JobSourceRegistry {
  private static instances: Map<string, JobSourceAdapter> = new Map();

  static {
    this.register(new NaukriAdapter());
    this.register(new IndeedAdapter());
    this.register(new FounditAdapter());
    this.register(new InternshalaAdapter());
    this.register(new WellfoundAdapter());
    this.register(new LinkedInAdapter());
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
           status[adapter.source] = health;
        } catch (e: any) {
           status[adapter.source] = {
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
}
