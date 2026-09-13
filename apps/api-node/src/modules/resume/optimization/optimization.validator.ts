import { IOptimizationProposal } from "./optimization.types";

export interface IProposalValidationResult {
  valid: boolean;
  rejectedReasons: string[];
  sanitizedProposal?: IOptimizationProposal;
}

export class OptimizationValidator {
  /**
   * Protected fields regex patterns
   */
  private static DATE_PATTERNS = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\d{4})\b/i;

  /**
   * Extract all numeric metrics from a string
   */
  public static extractMetrics(text: string): string[] {
    const matches = text.match(/\b(?:\d+(?:\.\d+)?%|\$\d+(?:\.\d+)?[mk]?|\d+x|\d+ms|\d+(?:,\d{3})+|\d+[mk]\b)/gi) || [];
    return matches.map((m) => m.toLowerCase());
  }

  /**
   * Validate an individual optimization proposal
   */
  public static validateProposal(
    proposal: IOptimizationProposal,
    verifiedContext: {
      knownCompanies?: string[];
      knownTitles?: string[];
      knownDegrees?: string[];
      knownDates?: string[];
      candidateSkills?: string[];
    } = {}
  ): IProposalValidationResult {
    const reasons: string[] = [];

    // 1. Check for empty replacement or identity
    if (!proposal.proposedText || proposal.proposedText.trim().length < 5) {
      reasons.push("Proposed text is empty or too short.");
    }
    if (proposal.originalText.trim() === proposal.proposedText.trim()) {
      reasons.push("Proposed text is identical to original text.");
    }

    // 2. Evidence validation
    if (!proposal.evidence || proposal.evidence.length === 0) {
      reasons.push("No grounding evidence provided. Proposals must cite verified resume context.");
    }

    // 3. Metric Invention Guard (Crucial Rule: Do NOT invent metrics!)
    const origMetrics = new Set(this.extractMetrics(proposal.originalText));
    const propMetrics = this.extractMetrics(proposal.proposedText);

    for (const metric of propMetrics) {
      if (!origMetrics.has(metric)) {
        reasons.push(
          `Fabricated metric detected: "${metric}". The AI must not invent percentages, dollar values, or performance multipliers not present in the source resume.`
        );
        break;
      }
    }

    // 4. Protected Fields Guard
    // Company name alteration
    for (const company of verifiedContext.knownCompanies || []) {
      if (company && proposal.originalText.includes(company) && !proposal.proposedText.includes(company)) {
        reasons.push(`Protected company name "${company}" was removed or altered.`);
      }
    }

    // Job title alteration
    for (const title of verifiedContext.knownTitles || []) {
      if (title && proposal.originalText.includes(title) && !proposal.proposedText.includes(title)) {
        reasons.push(`Protected job title "${title}" was removed or altered.`);
      }
    }

    // Institution or Degree alteration
    for (const deg of verifiedContext.knownDegrees || []) {
      if (deg && proposal.originalText.includes(deg) && !proposal.proposedText.includes(deg)) {
        reasons.push(`Protected degree or educational credential "${deg}" was altered.`);
      }
    }

    // 5. Unverified Technical Keyword Guard
    // Check if proposedText introduces new tech terms not in originalText AND not in candidateSkills
    if (verifiedContext.candidateSkills && verifiedContext.candidateSkills.length > 0) {
      const TECH_TERM_RE = /\b([A-Z][a-zA-Z0-9+.#/-]{1,25}|[a-z][a-z0-9+.#/-]{2,25})\b/g;
      const origWords = new Set((proposal.originalText.match(TECH_TERM_RE) || []).map((w) => w.toLowerCase()));
      const propWords = (proposal.proposedText.match(TECH_TERM_RE) || []).map((w) => w.toLowerCase());
      const skillsLower = new Set(verifiedContext.candidateSkills.map((s) => s.toLowerCase()));
      const COMMON_WORDS = new Set([
        "the", "and", "for", "with", "using", "from", "into", "across", "within", "through",
        "improved", "increased", "reduced", "built", "developed", "implemented", "led", "managed",
        "created", "designed", "delivered", "maintained", "deployed", "automated", "integrated",
        "collaborated", "supported", "streamlined", "optimized", "to", "by", "that", "this",
        "team", "systems", "system", "platform", "platforms", "services", "service", "application",
        "applications", "product", "products", "solution", "solutions", "project", "projects",
        "performance", "scalability", "reliability", "efficiency", "velocity", "quality",
        "stakeholder", "stakeholders", "cross", "functional", "real", "time", "end", "high"
      ]);

      const unverifiedKeywords = propWords.filter(
        (w) => !origWords.has(w) && !skillsLower.has(w) && !COMMON_WORDS.has(w) && w.length > 3
      );

      // Only block if the proposed text introduces 2+ unverified tech terms (to avoid false positives)
      if (unverifiedKeywords.length >= 2) {
        reasons.push(
          `Introduces unverified technical keywords not found in candidate's skill profile: ${unverifiedKeywords.slice(0, 3).join(", ")}. Only use technologies from the candidate's verified resume.`
        );
      }
    }

    const valid = reasons.length === 0;

    return {
      valid,
      rejectedReasons: reasons,
      sanitizedProposal: valid ? proposal : undefined
    };
  }

  /**
   * Filter and sanitize an array of proposals
   */
  public static filterValidProposals(
    proposals: IOptimizationProposal[],
    verifiedContext: {
      knownCompanies?: string[];
      knownTitles?: string[];
      knownDegrees?: string[];
      knownDates?: string[];
      candidateSkills?: string[];
    } = {}
  ): { validProposals: IOptimizationProposal[]; rejectedProposals: { proposal: IOptimizationProposal; reasons: string[] }[] } {
    const validProposals: IOptimizationProposal[] = [];
    const rejectedProposals: { proposal: IOptimizationProposal; reasons: string[] }[] = [];

    for (const p of proposals) {
      const res = this.validateProposal(p, verifiedContext);
      if (res.valid && res.sanitizedProposal) {
        validProposals.push(res.sanitizedProposal);
      } else {
        rejectedProposals.push({ proposal: p, reasons: res.rejectedReasons });
      }
    }

    return { validProposals, rejectedProposals };
  }
}
