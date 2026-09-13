import { IngestionPipeline } from './ingestion.pipeline';
import { JobSourceRegistry } from './source.registry';
import { BrowserService } from './browser.service';

export class JobScheduler {
  private static intervalId: NodeJS.Timeout | null = null;
  private static isRunning = false;

  static start() {
    if (this.intervalId) return;

    // Run every 1 hour (3600000 ms)
    const HOURLY = 60 * 60 * 1000;
    
    // Initial run delayed by 1 minute to not block server startup
    setTimeout(() => this.runBatch(), 60000);
    
    this.intervalId = setInterval(() => {
      this.runBatch();
    }, HOURLY);
    
    console.log('[JobScheduler] Started hourly background ingestion.');
  }

  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('[JobScheduler] Stopped.');
  }

  private static async runBatch() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[JobScheduler] Starting hourly batch scrape...');

    try {
      const queries = ["software engineer", "frontend developer", "backend developer", "react", "node", "java", "python"];
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];

      const adapters = JobSourceRegistry.getAllAdapters();

      for (const adapter of adapters) {
        // Limit to max 2 pages per hourly sync to remain under radar and keep DB fresh incrementally
        // IngestionPipeline loop already stops at max pages or 48h limit
        try {
           console.log(`[JobScheduler] Syncing ${adapter.source}...`);
           await IngestionPipeline.executeSource(adapter, randomQuery);
        } catch (err) {
           console.error(`[JobScheduler] Sync failed for ${adapter.source}:`, err);
        }
      }

    } catch (err) {
      console.error('[JobScheduler] Batch failed:', err);
    } finally {
      this.isRunning = false;
      await BrowserService.close(); // cleanup browsers
      console.log('[JobScheduler] Hourly batch complete.');
    }
  }
}
