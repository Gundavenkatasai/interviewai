import { IngestionPipeline } from './ingestion.pipeline';
import { JobSourceRegistry } from './source.registry';
import { BrowserService } from './browser.service';
import { Job, JobSourceStatus, JobValidationLog } from '../jobs.model';
import { JobEligibilityEngine } from '../eligibility.engine';

export class JobScheduler {
  private static intervalId: NodeJS.Timeout | null = null;
  private static isRunning = false;
  // 15-minute background sync as required
  public static readonly SYNC_INTERVAL_MS = 15 * 60 * 1000;

  static start() {
    if (this.intervalId) return;

    // Initial run delayed by 30 seconds
    setTimeout(() => this.runBatch(), 30000);

    this.intervalId = setInterval(() => {
      this.runBatch();
    }, this.SYNC_INTERVAL_MS);

    console.log('[JobScheduler] Started 15-minute automated collection schedule.');
  }

  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('[JobScheduler] Stopped.');
  }

  /**
   * Run sync for all sources or a single source.
   */
  static async runBatch(targetSource?: string) {
    if (this.isRunning) {
      console.log('[JobScheduler] Sync already in progress, skipping overlapping run.');
      return;
    }
    this.isRunning = true;
    const startTime = Date.now();
    console.log(`[JobScheduler] Starting synchronization${targetSource ? ` for ${targetSource}` : ' for all 14 sources'}...`);

    try {
      const queries = ["software engineer", "frontend", "backend", "full stack", "react", "node", "python", "ai intern"];
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];

      let adapters = JobSourceRegistry.getAllAdapters();
      if (targetSource) {
        adapters = adapters.filter(
          a => a.source.toLowerCase() === targetSource.toLowerCase()
        );
      }

      for (const adapter of adapters) {
        const sourceStart = Date.now();
        try {
          console.log(`[JobScheduler] Syncing source: ${adapter.source}`);
          const run = await IngestionPipeline.executeSource(adapter, randomQuery, undefined, 2);

          // Update Source Status
          await JobSourceStatus.findOneAndUpdate(
            { name: adapter.source },
            {
              $set: {
                status: run?.status === "running" ? "active" : (run?.status || "active"),
                lastRun: new Date(),
                jobsCount: run?.jobsAccepted || 0,
                durationMs: Date.now() - sourceStart,
                error: run?.errorCount ? `${run.errorCount} errors during collection` : null,
              }
            },
            { upsert: true }
          );
        } catch (err: any) {
          console.error(`[JobScheduler] Error syncing ${adapter.source}:`, err.message);
          await JobSourceStatus.findOneAndUpdate(
            { name: adapter.source },
            {
              $set: {
                status: "FAILING",
                lastRun: new Date(),
                error: err.message,
                durationMs: Date.now() - sourceStart,
              }
            },
            { upsert: true }
          );
        }
      }

      // Run automatic 72-hour archive sweep
      await this.archiveExpiredJobs();

    } catch (err) {
      console.error('[JobScheduler] Synchronization cycle encountered an error:', err);
    } finally {
      this.isRunning = false;
      await BrowserService.close();
      console.log(`[JobScheduler] Synchronization cycle completed in ${(Date.now() - startTime) / 1000}s.`);
    }
  }

  /**
   * Periodic cleanup: archive jobs that cross the 72-hour cutoff.
   * Ensures expired postings never appear in user-facing listings.
   */
  static async archiveExpiredJobs(): Promise<number> {
    const cutoff72h = JobEligibilityEngine.getCutoffDate(72);
    const now = new Date();

    const expiredDocs = await Job.find({
      isActive: true,
      $or: [
        { sourcePostedAt: { $lt: cutoff72h } },
        { sourcePostedAt: { $gt: now } },
        { postingDateConfidence: { $in: ["UNKNOWN", "unknown", "UNVERIFIED", "unverified"] } },
        { isExpired: true }
      ]
    }).limit(500);

    if (expiredDocs.length === 0) return 0;

    const expiredIds = expiredDocs.map(d => d._id);
    await Job.updateMany(
      { _id: { $in: expiredIds } },
      { $set: { isExpired: true, isActive: false, status: "EXPIRED" } }
    );

    // Audit log
    for (const doc of expiredDocs) {
      try {
        await JobValidationLog.create({
          jobId: doc._id,
          title: doc.title,
          companyName: doc.companyName,
          source: doc.source,
          originalPublishedAt: doc.sourcePostedAt,
          decision: "REJECTED",
          reason: "ARCHIVED_EXCEEDED_72_HOURS: Job crossed the strict 72-hour cutoff boundary.",
        });
      } catch (_) {}
    }

    console.log(`[JobScheduler] Archived ${expiredIds.length} expired postings crossing the 72h window.`);
    return expiredIds.length;
  }
}
