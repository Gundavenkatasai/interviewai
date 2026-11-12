import mongoose from "mongoose";
import { Job } from "../src/modules/jobs/jobs.model";
import { JobNormalizer } from "../src/modules/jobs/ingestion/job.normalizer";
import { UnstopAdapter } from "../src/modules/jobs/ingestion/adapters/unstop.adapter";
import { AicteAdapter } from "../src/modules/jobs/ingestion/adapters/aicte.adapter";
import { FreshersworldAdapter } from "../src/modules/jobs/ingestion/adapters/freshersworld.adapter";
import { LetsInternAdapter } from "../src/modules/jobs/ingestion/adapters/letsintern.adapter";
import { Youth4workAdapter } from "../src/modules/jobs/ingestion/adapters/youth4work.adapter";
import { FounditZunoAdapter } from "../src/modules/jobs/ingestion/adapters/founditzuno.adapter";
import { LinkedInAdapter } from "../src/modules/jobs/ingestion/adapters/linkedin.adapter";
import { NaukriAdapter } from "../src/modules/jobs/ingestion/adapters/naukri.adapter";
import { NaukriCampusAdapter } from "../src/modules/jobs/ingestion/adapters/naukricampus.adapter";
import { IndeedAdapter } from "../src/modules/jobs/ingestion/adapters/indeed.adapter";
import { FounditAdapter } from "../src/modules/jobs/ingestion/adapters/foundit.adapter";
import { GlassdoorAdapter } from "../src/modules/jobs/ingestion/adapters/glassdoor.adapter";
import { TimesJobsAdapter } from "../src/modules/jobs/ingestion/adapters/timesjobs.adapter";
import { JobSourceAdapter } from "../src/modules/jobs/ingestion/adapter.interface";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/interviewai";

async function run() {
  console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB successfully!");

  const adapters: { name: string; adapter: JobSourceAdapter }[] = [
    { name: "LinkedIn", adapter: new LinkedInAdapter() },
    { name: "Naukri", adapter: new NaukriAdapter() },
    { name: "Naukri Campus", adapter: new NaukriCampusAdapter() },
    { name: "Indeed", adapter: new IndeedAdapter() },
    { name: "Foundit", adapter: new FounditAdapter() },
    { name: "Glassdoor", adapter: new GlassdoorAdapter() },
    { name: "TimesJobs", adapter: new TimesJobsAdapter() },
    { name: "Unstop", adapter: new UnstopAdapter() },
    { name: "AICTE Internship", adapter: new AicteAdapter() },
    { name: "Freshersworld", adapter: new FreshersworldAdapter() },
    { name: "LetsIntern", adapter: new LetsInternAdapter() },
    { name: "Youth4work", adapter: new Youth4workAdapter() },
    { name: "Foundit Zuno", adapter: new FounditZunoAdapter() },
  ];

  const results: Record<string, { fetched: number; saved: number }> = {};

  for (const { name, adapter } of adapters) {
    console.log(`\n======================================================`);
    console.log(`[Ingestion] Starting ingestion for: ${name}`);
    console.log(`======================================================`);

    try {
      const page = await adapter.search({ limit: 25 });
      console.log(`[${name}] Fetched ${page.jobs.length} opportunities.`);

      let savedCount = 0;
      for (const raw of page.jobs) {
        const normalized = JobNormalizer.normalize(raw, name);
        if (!normalized) {
          console.log(`[${name}] Job rejected by normalizer: ${raw.title}`);
          continue;
        }

        const { _id, ...fieldsToSet } = normalized;

        // Upsert by canonicalUrl or title+company
        const filter = normalized.canonicalUrl
          ? { canonicalUrl: normalized.canonicalUrl }
          : { title: normalized.title, companyName: normalized.companyName };

        const updateDoc = {
          $set: {
            ...fieldsToSet,
            updatedAt: new Date()
          },
          $setOnInsert: {
            _id: _id || new mongoose.Types.ObjectId().toString(),
            createdAt: new Date()
          }
        };

        await Job.updateOne(filter, updateDoc, { upsert: true });
        savedCount++;
      }

      console.log(`[${name}] Successfully ingested and saved ${savedCount} opportunities into MongoDB!`);
      results[name] = { fetched: page.jobs.length, saved: savedCount };

    } catch (err: any) {
      console.error(`[${name}] Ingestion failed:`, err.message);
      results[name] = { fetched: 0, saved: 0 };
    }
  }

  console.log(`\n======================================================`);
  console.log(`[Ingestion Summary]`);
  console.log(`======================================================`);
  for (const [platform, stat] of Object.entries(results)) {
    console.log(`${platform.padEnd(20)}: Fetched ${stat.fetched.toString().padStart(2)}, Saved ${stat.saved.toString().padStart(2)} to MongoDB`);
  }

  const totalInDb = await Job.countDocuments();
  console.log(`\nTotal verified opportunities in MongoDB: ${totalInDb}`);

  await mongoose.disconnect();
  console.log("Database connection closed.");
}

run().catch(err => {
  console.error("Fatal error during internship ingestion:", err);
  process.exit(1);
});
