export type HookStyle =
  | "curiosity"
  | "contrarian"
  | "story"
  | "mistake"
  | "lesson"
  | "number"
  | "question"
  | "experience"
  | "technical_insight";

export interface HookVariant {
  style: HookStyle;
  hookText: string;
  formulaCode: string;
  formulaName: string;
  rationale: string;
}

export class HookGenerator {
  /**
   * Generates multiple proven hook variants based on topic and candidate facts
   */
  static generateHooks(params: {
    topic: string;
    targetRole?: string;
    keyMetric?: string;
    technicalFocus?: string;
  }): HookVariant[] {
    const { topic, keyMetric, technicalFocus } = params;
    const metricStr = keyMetric || "42% latency reduction";
    const techStr = technicalFocus || "distributed systems";

    return [
      {
        style: "number",
        hookText: `We spent $4,820 debugging a single query before realizing our index was dead.`,
        formulaCode: "F7",
        formulaName: "Odd-Precision Money/Cost Ledger",
        rationale: "Specific non-rounded numbers with clear referent generate highest reader trust and stop the scroll.",
      },
      {
        style: "contrarian",
        hookText: `Microservices aren't making your team faster. They're hiding architectural indecision.`,
        formulaCode: "F10",
        formulaName: "Contrarian + Historical Receipts",
        rationale: "Challenging industry consensus immediately sparks engagement and discussion in comments.",
      },
      {
        style: "story",
        hookText: `18 months ago, our production database locked up during our biggest customer launch.`,
        formulaCode: "F4",
        formulaName: "Time-Anchor Confession",
        rationale: "Dated specific narrative anchors pull readers into an authentic technical journey.",
      },
      {
        style: "mistake",
        hookText: `The biggest mistake I made when designing our ${techStr} wasn't the database. It was the cache invalidation.`,
        formulaCode: "F18",
        formulaName: "False-Binary Dissolve",
        rationale: "Admitting a real technical pitfall provides educational value to engineering peers.",
      },
      {
        style: "lesson",
        hookText: `Here is what nobody tells you about senior engineering promotions:`,
        formulaCode: "F2",
        formulaName: "Direct Lesson Reveal",
        rationale: "High curiosity opener addressing career transitions directly.",
      },
      {
        style: "technical_insight",
        hookText: `How we achieved a ${metricStr} without rewriting our codebase:`,
        formulaCode: "F17",
        formulaName: "Controlled A/B Anecdote",
        rationale: "Actionable engineering post promising concrete implementation techniques.",
      },
      {
        style: "question",
        hookText: `Why do most backend engineers still get database indexing wrong in production?`,
        formulaCode: "F6",
        formulaName: "Diagnostic Provocation",
        rationale: "Direct diagnostic inquiry inviting engineers to reflect and comment.",
      },
    ];
  }
}
