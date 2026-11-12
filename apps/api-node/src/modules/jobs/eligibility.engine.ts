/**
 * 72-Hour Job Eligibility Engine
 *
 * Strict, non-negotiable rule:
 * A job MUST be verified as having been originally published within the LAST 72 HOURS.
 *
 * Cutoff: current UTC timestamp - 72 hours
 * Condition: published_at >= cutoff AND published_at <= current_timestamp
 *
 * - A job posted 10 minutes ago: SHOW.
 * - A job posted 24 hours ago: SHOW.
 * - A job posted 48 hours ago: SHOW.
 * - A job posted exactly 72 hours ago: SHOW (inclusive cutoff).
 * - A job posted 73 hours ago: NEVER SHOW.
 * - A job with an unknown or unverifiable original publication date: NEVER SHOW.
 * - A job with an invalid publication timestamp: NEVER SHOW.
 * - A job whose deadline is still active but was posted > 72 hours ago: NEVER SHOW.
 * - A job updated today but originally posted 10 days ago: NEVER SHOW.
 */

export interface JobEligibilityResult {
  eligible: boolean;
  reason: string;
  hoursOld?: number;
  timeRemainingHours?: number;
  verifiedPublishedAt?: Date;
}

export class JobEligibilityEngine {
  public static readonly MAX_WINDOW_HOURS = 72;
  private static readonly FUTURE_GRACE_MINUTES = 5; // allow 5m clock skew

  /**
   * Calculate the strict cutoff timestamp for a given window in hours (capped at 72h).
   */
  public static getCutoffDate(requestedHours: number = 72): Date {
    const hours = Math.min(Math.max(requestedHours, 1), this.MAX_WINDOW_HOURS);
    return new Date(Date.now() - hours * 60 * 60 * 1000);
  }

  /**
   * Validate if a job strictly meets the 72-hour requirement.
   */
  public static evaluateJob(job: {
    sourcePostedAt?: Date | string | null;
    originalPublishedAt?: Date | string | null;
    postedAt?: Date | string | null;
    postingDateConfidence?: string | null;
    isActive?: boolean;
    isExpired?: boolean;
    deadline?: Date | string | null;
    createdAt?: Date | string | null;
  }, requestedWindowHours: number = 72): JobEligibilityResult {
    // 1. Identify original published timestamp
    const rawDate = job.originalPublishedAt || job.sourcePostedAt;

    if (!rawDate) {
      return {
        eligible: false,
        reason: "REJECTED_MISSING_PUBLICATION_DATE: Original publication date is missing or not provided.",
      };
    }

    const pubDate = new Date(rawDate);
    if (isNaN(pubDate.getTime())) {
      return {
        eligible: false,
        reason: "REJECTED_INVALID_PUBLICATION_DATE: Publication timestamp is malformed or unparseable.",
      };
    }

    // 2. Validate confidence / provenance
    const confidence = (job.postingDateConfidence || "").toUpperCase();
    if (confidence === "UNKNOWN" || confidence === "UNVERIFIED" || confidence === "LOW_UNTRUSTED") {
      return {
        eligible: false,
        reason: "REJECTED_UNVERIFIABLE_DATE: Publication date confidence is untrusted or unverified.",
      };
    }

    const now = new Date();
    const maxFuture = new Date(now.getTime() + this.FUTURE_GRACE_MINUTES * 60 * 1000);

    // 3. Prevent future dates (except minor clock skew)
    if (pubDate > maxFuture) {
      return {
        eligible: false,
        reason: `REJECTED_FUTURE_DATE: Publication date ${pubDate.toISOString()} is in the future.`,
      };
    }

    // 4. Calculate strict age in hours
    const ageMs = now.getTime() - pubDate.getTime();
    const hoursOld = ageMs / (1000 * 60 * 60);

    // 5. Enforce 72-hour ceiling (or shorter user filter, never longer)
    const effectiveMaxHours = Math.min(requestedWindowHours || this.MAX_WINDOW_HOURS, this.MAX_WINDOW_HOURS);
    const cutoff = this.getCutoffDate(effectiveMaxHours);

    // Inclusive cutoff: pubDate must be >= cutoff (allowing 500ms execution boundary for exact cutoff equality)
    if (pubDate.getTime() < cutoff.getTime() - 500) {
      return {
        eligible: false,
        reason: `REJECTED_EXCEEDS_72_HOURS: Job was published ${hoursOld.toFixed(1)}h ago (cutoff is ${effectiveMaxHours}h).`,
        hoursOld,
        timeRemainingHours: 0,
      };
    }

    // 6. Check deadline if specified
    if (job.deadline) {
      const deadlineDate = new Date(job.deadline);
      if (!isNaN(deadlineDate.getTime()) && deadlineDate.getTime() < now.getTime()) {
        return {
          eligible: false,
          reason: "REJECTED_DEADLINE_PASSED: The application deadline for this job has expired.",
          hoursOld,
          timeRemainingHours: 0,
        };
      }
    }

    // 7. Check if manually expired
    if (job.isExpired || job.isActive === false) {
      return {
        eligible: false,
        reason: "REJECTED_JOB_INACTIVE_OR_EXPIRED: Job record is marked inactive or expired.",
        hoursOld,
        timeRemainingHours: 0,
      };
    }

    const timeRemainingHours = Math.max(0, this.MAX_WINDOW_HOURS - hoursOld);

    return {
      eligible: true,
      reason: "ACCEPTED_WITHIN_72_HOURS",
      hoursOld,
      timeRemainingHours: parseFloat(timeRemainingHours.toFixed(1)),
      verifiedPublishedAt: pubDate,
    };
  }

  /**
   * Generate strict MongoDB query filter enforcing the 72-hour rule.
   *
   * NEVER ALLOW EXPIRED POSTINGS TO APPEAR.
   * NEVER ALLOW JOBS WITH UNKNOWN PUBLICATION DATES.
   */
  public static buildStrictMongoFilter(filterHours: number = 72): Record<string, any> {
    const effectiveHours = Math.min(Math.max(filterHours, 1), this.MAX_WINDOW_HOURS);
    const cutoff = this.getCutoffDate(effectiveHours);
    const now = new Date();

    return {
      isActive: { $ne: false },
      isExpired: { $ne: true },
      // Strict publication date boundary: cutoff <= sourcePostedAt <= now
      sourcePostedAt: {
        $gte: cutoff,
        $lte: now,
      },
      // Confidence MUST be verified
      postingDateConfidence: {
        $nin: ["UNKNOWN", "unknown", "UNVERIFIED", "unverified"],
      },
    };
  }
}
