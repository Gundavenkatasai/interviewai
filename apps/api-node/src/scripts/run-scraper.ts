import { BrowserService } from '../modules/jobs/ingestion/browser.service';
import { IngestionPipeline } from '../modules/jobs/ingestion/ingestion.pipeline';
import { JobSourceRegistry } from '../modules/jobs/ingestion/source.registry';
import mongoose from 'mongoose';
import { env } from '../config/env';

async function runScrapers() {
  console.log('Starting global scraper job from registry...');
  try {
    await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
    console.log(`Connected to MongoDB: ${env.MONGODB_DB_NAME}`);

    const adapters = JobSourceRegistry.getAllAdapters();
    const query = 'software engineer'; // Default query for cron

    for (const adapter of adapters) {
      console.log(`\n======================================================`);
      console.log(`[ORCHESTRATOR] Starting source: ${adapter.source}`);
      console.log(`======================================================\n`);
      try {
        const run = await IngestionPipeline.executeSource(adapter, query);
        console.log(`[${adapter.source}] Ingested ${run.jobsAccepted} jobs.`);
      } catch (err) {
         console.error(`[${adapter.source}] Failed top-level execution:`, err);
      }
    }

    console.log('\nScraping & Ingestion complete for all sources.');
  } catch (err) {
    console.error('Error during scraping orchestrator:', err);
  } finally {
    await BrowserService.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

runScrapers();
