import mongoose from "mongoose";
import { JobApplication } from "../applications/applications.model";
import { Job } from "../jobs/jobs.model";
import { InterviewSession } from "../interview/interview.model";
import { FollowUpTask } from "../outreach/followup.model";

export class AnalyticsEngine {
  
  static async calculateFunnelMetrics(userId: string, start: Date, end: Date) {
    // Determine the funnel stats deterministically based on JobApplication statuses
    const applications = await JobApplication.find({
      userId,
      createdAt: { $gte: start, $lte: end }
    }).select('_id status');

    const total = applications.length;
    const saved = applications.filter(a => a.status === 'SAVED').length;
    const prepared = applications.filter(a => a.status === 'READY_TO_APPLY').length;
    const submitted = applications.filter(a => ['APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED'].includes(a.status)).length;
    const interviewing = applications.filter(a => ['INTERVIEWING', 'OFFER'].includes(a.status)).length;
    const offers = applications.filter(a => a.status === 'OFFER').length;

    const submittedAppIds = applications.filter(a => ['APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED'].includes(a.status)).map(a => a._id);
    const interviewingAppIds = applications.filter(a => ['INTERVIEWING', 'OFFER'].includes(a.status)).map(a => a._id);

    return {
      total,
      saved,
      prepared,
      submitted,
      interviewing,
      offers,
      interviewRate: submitted > 0 ? interviewing / submitted : 0,
      offerRate: interviewing > 0 ? offers / interviewing : 0,
      evidenceIds: {
        submitted: submittedAppIds,
        interviewing: interviewingAppIds
      }
    };
  }

  static async calculateSourcePerformance(userId: string, start: Date, end: Date) {
    const apps = await JobApplication.find({
      userId,
      createdAt: { $gte: start, $lte: end }
    }).populate('jobId', 'source matchScore');

    const sourceMap = new Map<string, any>();

    for (const app of apps) {
      const job = app.jobId as any;
      const source = job?.source || 'Unknown';
      
      if (!sourceMap.has(source)) {
        sourceMap.set(source, {
          source,
          applications: 0,
          interviews: 0,
          totalMatchScore: 0,
          matchScoreCount: 0,
          evidenceIds: []
        });
      }

      const s = sourceMap.get(source);
      s.applications += 1;
      s.evidenceIds.push(app._id);
      
      if (['INTERVIEWING', 'OFFER'].includes(app.status)) {
        s.interviews += 1;
      }
      
      if (job?.matchScore) {
        s.totalMatchScore += job.matchScore;
        s.matchScoreCount += 1;
      }
    }

    const results = Array.from(sourceMap.values()).map(s => {
      const interviewRate = s.applications > 0 ? s.interviews / s.applications : 0;
      const averageMatch = s.matchScoreCount > 0 ? s.totalMatchScore / s.matchScoreCount : null;
      let confidence = 'INSUFFICIENT_DATA';
      if (s.applications >= 15) confidence = 'HIGHER_CONFIDENCE';
      else if (s.applications >= 6) confidence = 'MEDIUM_CONFIDENCE';
      else if (s.applications >= 3) confidence = 'LOW_CONFIDENCE';

      return {
        source: s.source,
        applications: s.applications,
        interviews: s.interviews,
        interviewRate,
        averageMatch,
        confidence,
        evidenceIds: s.evidenceIds
      };
    });

    return results.sort((a, b) => b.applications - a.applications);
  }

  static async calculateRolePerformance(userId: string, start: Date, end: Date) {
    const apps = await JobApplication.find({
      userId,
      createdAt: { $gte: start, $lte: end }
    }).select('_id status jobTitle');

    const roleMap = new Map<string, any>();

    for (const app of apps) {
      const role = this.normalizeRole(app.jobTitle || 'Unknown Role');
      
      if (!roleMap.has(role)) {
        roleMap.set(role, {
          role,
          applications: 0,
          interviews: 0,
          evidenceIds: []
        });
      }

      const r = roleMap.get(role);
      r.applications += 1;
      r.evidenceIds.push(app._id);
      
      if (['INTERVIEWING', 'OFFER'].includes(app.status)) {
        r.interviews += 1;
      }
    }

    return Array.from(roleMap.values()).map(r => {
      let confidence = 'INSUFFICIENT_DATA';
      if (r.applications >= 15) confidence = 'HIGHER_CONFIDENCE';
      else if (r.applications >= 6) confidence = 'MEDIUM_CONFIDENCE';
      else if (r.applications >= 3) confidence = 'LOW_CONFIDENCE';

      return {
        ...r,
        interviewRate: r.applications > 0 ? r.interviews / r.applications : 0,
        confidence
      };
    }).sort((a, b) => b.applications - a.applications);
  }

  static async calculateInterviewPerformance(userId: string, start: Date, end: Date) {
    const interviews = await InterviewSession.find({
      userId,
      status: 'COMPLETED',
      created_at: { $gte: start, $lte: end }
    });

    const total = interviews.length;
    let totalScore = 0;
    
    for (const i of interviews) {
      if (i.score?.overall_score) {
        totalScore += i.score.overall_score;
      }
    }

    return {
      totalInterviews: total,
      averageScore: total > 0 ? totalScore / total : null,
      evidenceIds: interviews.map(i => i._id)
    };
  }

  private static normalizeRole(title: string): string {
    const t = title.toLowerCase();
    if (t.includes('software engineer') || t.includes('sde') || t.includes('developer')) return 'Software Engineer';
    if (t.includes('backend')) return 'Backend Engineer';
    if (t.includes('frontend')) return 'Frontend Engineer';
    if (t.includes('full stack')) return 'Full Stack Engineer';
    if (t.includes('data')) return 'Data Roles';
    if (t.includes('product manager') || t.includes('pm')) return 'Product Management';
    return 'Other';
  }
}
