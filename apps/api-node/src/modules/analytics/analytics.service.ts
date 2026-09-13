import { CareerAnalyticsSnapshot } from "./analytics.model";
import { AnalyticsEngine } from "./analytics.engine";
import { CareerGapEngine } from "./career-gap.engine";
import { NextBestActionEngine } from "./next-action.engine";
import { AnalyticsAIEngine } from "./analytics-ai.engine";

export class AnalyticsService {
  static async getOverview(userId: string, forceRefresh = false) {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days default
    
    if (!forceRefresh) {
      const existing = await CareerAnalyticsSnapshot.findOne({
        userId,
        periodStart: { $lte: start },
        periodEnd: { $gte: end },
        generatedAt: { $gte: new Date(end.getTime() - 24 * 60 * 60 * 1000) } // valid for 24h
      }).sort({ generatedAt: -1 });

      if (existing) return existing;
    }

    // Layer A & B: Deterministic Metrics
    const funnelMetrics = await AnalyticsEngine.calculateFunnelMetrics(userId, start, end);
    const sourceMetrics = await AnalyticsEngine.calculateSourcePerformance(userId, start, end);
    const roleMetrics = await AnalyticsEngine.calculateRolePerformance(userId, start, end);
    const interviewMetrics = await AnalyticsEngine.calculateInterviewPerformance(userId, start, end);

    // Data Quality
    const dataQuality = {
      totalRecords: funnelMetrics.total + interviewMetrics.totalInterviews,
      completenessPercentage: 100, // simplify for now
      missingSourceCount: sourceMetrics.find(s => s.source === 'Unknown')?.applications || 0,
      missingOutcomeCount: 0 
    };

    // Layer C: Career Gap Engine
    const gapMetrics = await CareerGapEngine.calculateGaps(userId, start, end);

    // Layer D: Next Best Action Engine
    const nextBestActions = NextBestActionEngine.calculateNextActions(gapMetrics);

    // AI Insight Layer (Wait until deterministic is complete)
    const aiSummary = await AnalyticsAIEngine.generateSummary({
      funnelMetrics,
      sourceMetrics
    }, gapMetrics);

    const snapshot = await CareerAnalyticsSnapshot.create({
      userId,
      periodStart: start,
      periodEnd: end,
      funnelMetrics,
      sourceMetrics,
      roleMetrics,
      resumeMetrics: [], // stub for resume performance if added
      interviewMetrics,
      gapMetrics,
      nextBestActions,
      aiSummary,
      dataQuality,
      calculationVersion: "v1.0.0"
    });

    return snapshot;
  }
}
