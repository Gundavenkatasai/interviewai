import { IJob, Job, JobValidationLog } from "../jobs.model";
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

    // 1. Check for exact same source & sourceJobId (we've seen this exact posting)
    const exactSourceMatch = await Job.findOne({ 
      source: normalizedJob.source, 
      sourceJobId: normalizedJob.sourceJobId 
    });
    
    if (exactSourceMatch) {
      exactSourceMatch.lastSeenAt = new Date();
      await exactSourceMatch.save();
      return exactSourceMatch;
    }

    // 2. Check for duplicate cluster across sources (Same Company + Similar Title + Location)
    let contentMatch = await Job.findOne({ contentHash: hash });
    if (!contentMatch) {
      contentMatch = await Job.findOne({ duplicateClusterId: canonicalKey });
    }
    
    if (contentMatch) {
      // Consolidate into the existing canonical job card
      const exists = contentMatch.sourceReferences.find(
        (r: any) => r.source === normalizedJob.source && r.sourceJobId === normalizedJob.sourceJobId
      );
      
      if (!exists && normalizedJob.sourceReferences?.[0]) {
        contentMatch.sourceReferences.push(normalizedJob.sourceReferences[0]);
        
        // Preserve earliest verified publication timestamp
        if (normalizedJob.sourcePostedAt && contentMatch.sourcePostedAt) {
          const incomingTime = new Date(normalizedJob.sourcePostedAt).getTime();
          const existingTime = new Date(contentMatch.sourcePostedAt).getTime();
          if (incomingTime < existingTime) {
            contentMatch.sourcePostedAt = new Date(incomingTime);
            contentMatch.originalPublishedAt = new Date(incomingTime);
          }
        }

        // Promote direct/ATS Apply URL
        if (
          normalizedJob.applyUrl &&
          (!contentMatch.applyUrl ||
            normalizedJob.jobQualitySignals?.sourceReliability === "HIGH")
        ) {
          contentMatch.applyUrl = normalizedJob.applyUrl;
          contentMatch.canonicalUrl = normalizedJob.canonicalUrl || normalizedJob.applyUrl;
        }

        contentMatch.lastSeenAt = new Date();
        await contentMatch.save();

        try {
          await JobValidationLog.create({
            jobId: contentMatch._id,
            title: contentMatch.title,
            companyName: contentMatch.companyName,
            source: normalizedJob.source,
            sourceJobId: normalizedJob.sourceJobId,
            originalPublishedAt: normalizedJob.sourcePostedAt,
            decision: "DUPLICATE_CONSOLIDATED",
            reason: `Merged multi-source listing from ${normalizedJob.source} into canonical job ${contentMatch._id}`,
          });
        } catch (_) {}
      }
      return contentMatch;
    }

    // 3. Brand new job within 72h
    normalizedJob.canonicalJobId = normalizedJob._id;
    const newJob = new Job(normalizedJob);
    await newJob.save();

    try {
      const ageHours = normalizedJob.sourcePostedAt
        ? (Date.now() - new Date(normalizedJob.sourcePostedAt).getTime()) / (1000 * 60 * 60)
        : 0;
      await JobValidationLog.create({
        jobId: newJob._id,
        title: newJob.title,
        companyName: newJob.companyName,
        source: newJob.source,
        sourceJobId: newJob.sourceJobId,
        originalPublishedAt: newJob.sourcePostedAt,
        decision: "ACCEPTED",
        reason: "Job published within 72-hour window and verified successfully.",
        ageHours: parseFloat(ageHours.toFixed(1)),
        timeRemainingHours: parseFloat(Math.max(0, 72 - ageHours).toFixed(1)),
      });
    } catch (_) {}

    return newJob;
  }
}
