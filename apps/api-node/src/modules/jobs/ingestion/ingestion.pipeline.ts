import { JobSourceAdapter } from "./adapter.interface";
import { JobNormalizer } from "./job.normalizer";
import { JobDeduplicator } from "./job.deduplicator";
import { JobIngestionRun } from "../jobs.model";
import { ReliabilityManager } from "../../../ai/reliability/reliability.manager";

export class IngestionPipeline {
  
  static async executeSource(adapter: JobSourceAdapter, query: string = "", companyName?: string, maxPages: number = 5) {
    const run = new JobIngestionRun({
      source: adapter.source,
      query,
      metadata: { 
        maxPagesConfigured: maxPages,
        companyName
      },
      status: "running"
    });
    await run.save();

    try {
      // 1. Health check capability
      const health = await adapter.healthCheck();
      if (health.status === "UNAVAILABLE" || health.status === "RESTRICTED" || health.status === "FAILING" || health.status === "RESTRICTED_NO_AUTH") {
         run.status = health.status;
         run.completedAt = new Date();
         run.metadata = { 
           ...run.metadata, 
           reason: health.restriction || "Source marked as unavailable, restricted, or failing." 
         };
         await run.save();
         return run;
      }

      // 2. Multi-page execution loop
      let currentPage = 1;
      let currentCursor: string | undefined = undefined;
      let hasNextPage = true;
      let consecutiveErrors = 0;
      let stoppedReason = "UNKNOWN";

      while (hasNextPage && currentPage <= maxPages) {
        try {
          console.log(`[IngestionPipeline] ${adapter.source} - Fetching page ${currentPage}`);
          const page = await adapter.search({ 
            query, 
            companyName, 
            page: currentPage,
            cursor: currentCursor
          });
          
          run.pagesAttempted++;
          run.jobsFetched += page.totalFetched;
          
          // 3. Process jobs for this page
          let processedOnPage = 0;
          for (const raw of page.jobs) {
            try {
              const normalized = JobNormalizer.normalize(raw, adapter.source);
              if (!normalized) {
                run.jobsRejected++;
                continue;
              }

              if (normalized.applyUrlStatus === 'INVALID') {
                 run.metadata = { ...run.metadata, invalidUrls: (run.metadata?.invalidUrls || 0) + 1 };
              }

              const savedJob = await JobDeduplicator.deduplicate(normalized);
              if (savedJob && savedJob.sourceReferences.length > 1 && savedJob.sourceReferences[savedJob.sourceReferences.length - 1].source === adapter.source) {
                run.duplicates++;
              } else {
                run.jobsAccepted++;
              }
              processedOnPage++;
            } catch (err) {
              run.errorCount++;
            }
          }

          // Decide whether to continue
          if (page.stoppedReason) {
            stoppedReason = page.stoppedReason;
            break; // Adapter explicitly told us to stop
          }

          if (!page.hasNextPage || page.jobs.length === 0) {
            stoppedReason = page.jobs.length === 0 ? "NO_RESULTS" : "EXHAUSTED";
            hasNextPage = false;
          } else if (currentPage >= maxPages) {
             stoppedReason = "CONFIGURED_MAX";
             hasNextPage = false;
          } else {
            // Setup for next page
            currentCursor = page.nextCursor;
            currentPage++;
            consecutiveErrors = 0; // reset on success
            
            // Artificial delay between pages to be polite
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

        } catch (err: any) {
          console.error(`[IngestionPipeline] ${adapter.source} - Error on page ${currentPage}:`, err.message);
          consecutiveErrors++;
          run.errorCount++;
          
          if (consecutiveErrors >= 3) {
            stoppedReason = "ERROR";
            run.metadata = { ...run.metadata, lastError: err.message };
            break; // Stop paginating after 3 consecutive errors
          }
          
          // Exponential backoff before retry
          await new Promise(resolve => setTimeout(resolve, 5000 * Math.pow(2, consecutiveErrors - 1)));
        }
      }

      run.status = "completed";
      run.completedAt = new Date();
      run.metadata = { ...run.metadata, stoppedReason, pagesScanned: run.pagesAttempted };
      await run.save();
      return run;

    } catch (globalErr: any) {
      run.status = "crashed";
      run.errorCount++;
      run.completedAt = new Date();
      run.metadata = { ...run.metadata, error: globalErr.message };
      await run.save();
      return run;
    }
  }
}
