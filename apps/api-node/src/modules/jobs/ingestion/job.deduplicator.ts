import { IJob, Job } from "../jobs.model";
import { createHash } from "crypto";

export class JobDeduplicator {
  
  static generateContentHash(job: Partial<IJob>): string {
    const canonicalString = `${job.title?.toLowerCase()}|${job.companyName?.toLowerCase()}|${job.location?.toLowerCase()}|${job.description?.toLowerCase()}`;
    return createHash("sha256").update(canonicalString).digest("hex");
  }

  static generateCanonicalKey(job: Partial<IJob>): string {
    const titleBase = job.title?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().substring(0, 20) || "";
    const compBase = job.companyName?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "";
    const locBase = job.location?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().substring(0, 10) || "";
    return `${compBase}_${titleBase}_${locBase}`;
  }

  static async deduplicate(normalizedJob: Partial<IJob>): Promise<IJob | null> {
    const hash = this.generateContentHash(normalizedJob);
    const canonicalKey = this.generateCanonicalKey(normalizedJob);
    
    normalizedJob.contentHash = hash;
    normalizedJob.duplicateClusterId = canonicalKey;

    // 1. Check for exact exact same source & sourceJobId (we've seen this exact posting)
    const exactSourceMatch = await Job.findOne({ 
      source: normalizedJob.source, 
      sourceJobId: normalizedJob.sourceJobId 
    });
    
    if (exactSourceMatch) {
      // It's the same job. We could update lastSeenAt.
      exactSourceMatch.lastSeenAt = new Date();
      await exactSourceMatch.save();
      return exactSourceMatch;
    }

    // 2. Check for duplicate cluster (Same Company + Similar Title + Similar Location)
    // First, try exact content hash. If not, try canonical key.
    let contentMatch = await Job.findOne({ contentHash: hash });
    
    if (!contentMatch) {
      contentMatch = await Job.findOne({ duplicateClusterId: canonicalKey });
    }
    
    if (contentMatch) {
      // Found a duplicate cluster!
      // Add this new source to the existing canonical job's sourceReferences
      const exists = contentMatch.sourceReferences.find(r => r.source === normalizedJob.source && r.sourceJobId === normalizedJob.sourceJobId);
      
      if (!exists) {
        contentMatch.sourceReferences.push(normalizedJob.sourceReferences![0]);
        // Promote Apply URL if the new one is higher reliability (e.g. ATS over Board)
        if (normalizedJob.jobQualitySignals?.sourceReliability === "HIGH" && contentMatch.jobQualitySignals?.sourceReliability !== "HIGH") {
           contentMatch.applyUrl = normalizedJob.applyUrl;
           contentMatch.jobQualitySignals.sourceReliability = "HIGH";
        }
        contentMatch.lastSeenAt = new Date();
        await contentMatch.save();
      }
      return contentMatch;
    }

    // 3. No match found, it's a new job.
    normalizedJob.canonicalJobId = normalizedJob._id; // It is its own canonical master
    const newJob = new Job(normalizedJob);
    await newJob.save();
    return newJob;
  }
}
