import { AIService } from "../../ai/ai.service";

export class AnalyticsAIEngine {
  static async generateSummary(metrics: any, gaps: any[]) {
    // We only provide deterministic metrics to the AI to prevent hallucination.
    const context = {
      applications: metrics.funnelMetrics.total,
      interviewRate: metrics.funnelMetrics.interviewRate,
      topSource: metrics.sourceMetrics.length > 0 ? metrics.sourceMetrics[0].source : 'None',
      gaps: gaps.slice(0, 3).map(g => ({ title: g.title, confidence: g.confidence, impact: g.priorityScore }))
    };

    const prompt = `You are explaining deterministic career analytics.
You MUST NOT:
- invent metrics
- invent outcomes
- invent skills
- invent interviews
- claim causality from correlation
- change supplied numbers

Use ONLY the supplied evidence below.
If evidence is insufficient or zero, say so.

Context:
${JSON.stringify(context, null, 2)}

Provide a short executive summary of what is working, what is not working, and the biggest opportunities. Keep it extremely brief (max 3 sentences).`;

    try {
      const response = await AIService.generateStructured([{ role: 'user', content: prompt }], {
        summary: "string",
        strengths: ["string"],
        concerns: ["string"]
      });
      return response;
    } catch (e) {
      console.error("AI Summary generation failed:", e);
      return {
        summary: "Unable to generate AI summary at this time.",
        strengths: [],
        concerns: []
      };
    }
  }
}
