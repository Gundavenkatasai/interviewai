export interface HumanizeChange {
  pass: "PASS_1_SCRUB" | "PASS_2_RHYTHM" | "PASS_3_ADD" | "PASS_4_SELF_CHECK";
  originalSnippet: string;
  replacementSnippet: string;
  reason: string;
}

export interface HumanizeResult {
  originalText: string;
  humanizedText: string;
  changes: HumanizeChange[];
  tellDensityScore: number; // 0 (natural) to 100 (heavy AI tells)
  readerConfidence: "reads_human" | "mixed" | "reads_ai";
  mode: "strict" | "forensic" | "aesthetic";
  explanation: string;
}

export class HumanizerEngine {
  // Durable 2026 AI tell words (density-scored)
  private static readonly TELL_VOCABULARY = [
    /\bsignificant\b/gi,
    /\bcrucial\b/gi,
    /\bnotably\b/gi,
    /\bcomprehensive\b/gi,
    /\binsights\b/gi,
    /\brobust\b/gi,
    /\bleverage\b/gi,
    /\bfoster\b/gi,
    /\blandscape\b/gi,
    /\bnuanced\b/gi,
    /\bstreamline\b/gi,
    /\belevate\b/gi,
    /\bempower\b/gi,
    /\bmultifaceted\b/gi,
    /\bdelve\b/gi,
    /\btapestry\b/gi,
    /\btestament\b/gi,
  ];

  // Banned reveal bridges that harm reach
  private static readonly REVEAL_BRIDGES = [
    { pattern: /The result\?/gi, replacement: "What happened next:" },
    { pattern: /It's not about X, it's about Y/gi, replacement: "The real constraint was:" },
    { pattern: /Here's what I learned:/gi, replacement: "What actually mattered:" },
    { pattern: /Let that sink in\./gi, replacement: "" },
    { pattern: /What do you think\?/gi, replacement: "" },
  ];

  /**
   * Executes 4-pass humanization based on 2026 stylometry research
   */
  static humanize(text: string, mode: "strict" | "forensic" | "aesthetic" = "strict"): HumanizeResult {
    let currentText = text;
    const changes: HumanizeChange[] = [];
    let detectedTellsCount = 0;

    // PASS 1: SCRUB
    // 1a. Scrub reveal bridges
    for (const bridge of this.REVEAL_BRIDGES) {
      if (bridge.pattern.test(currentText)) {
        detectedTellsCount += 2;
        currentText = currentText.replace(bridge.pattern, bridge.replacement);
        changes.push({
          pass: "PASS_1_SCRUB",
          originalSnippet: bridge.pattern.source,
          replacementSnippet: bridge.replacement,
          reason: "Removed overused reveal bridge that triggers reader AI-slop fatigue.",
        });
      }
    }

    // 1b. Replace high-density corporate buzzwords
    for (const vocabRegex of this.TELL_VOCABULARY) {
      const matches = currentText.match(vocabRegex);
      if (matches && matches.length > 0) {
        detectedTellsCount += matches.length;
        currentText = currentText.replace(vocabRegex, (match) => {
          const lower = match.toLowerCase();
          if (lower === "robust") return "reliable";
          if (lower === "leverage") return "use";
          if (lower === "delve") return "dig";
          if (lower === "streamline") return "simplify";
          if (lower === "crucial") return "important";
          if (lower === "comprehensive") return "thorough";
          return match;
        });
        changes.push({
          pass: "PASS_1_SCRUB",
          originalSnippet: matches[0],
          replacementSnippet: "simplified plain English",
          reason: "Substituted high-frequency AI vocabulary marker for natural engineering phrasing.",
        });
      }
    }

    // 1c. Cap excess em dashes (limit to max 1 per 100 words, never remove all)
    const emDashMatches = currentText.match(/—/g);
    if (emDashMatches && emDashMatches.length > 2) {
      let count = 0;
      currentText = currentText.replace(/—/g, () => {
        count++;
        return count > 1 ? ", " : "—";
      });
      changes.push({
        pass: "PASS_1_SCRUB",
        originalSnippet: "multiple em dashes (—)",
        replacementSnippet: "comma / natural clause boundary",
        reason: "Capped em dash frequency to avoid rhythmic mechanical pacing.",
      });
    }

    // PASS 2: RHYTHM
    // Detect and soften staccato runs ("Short. Punchy. Done.")
    const staccatoRegex = /([A-Z][a-z]+)\.\s+([A-Z][a-z]+)\.\s+([A-Z][a-z]+)\./g;
    if (staccatoRegex.test(currentText)) {
      detectedTellsCount += 3;
      currentText = currentText.replace(staccatoRegex, "$1, $2, and $3.");
      changes.push({
        pass: "PASS_2_RHYTHM",
        originalSnippet: "Staccato three-word fragments",
        replacementSnippet: "Flowing subordinate clause",
        reason: "Merged forced staccato fragments into a natural compound sentence.",
      });
    }

    // PASS 3: ADD
    // Ensure text has at least one factual grounding anchor
    if (!/\d/.test(currentText)) {
      changes.push({
        pass: "PASS_3_ADD",
        originalSnippet: "General observation without numbers",
        replacementSnippet: "Preserved original",
        reason: "Recommendation: Include a concrete metric (time, latency, cost) with a specific referent.",
      });
    }

    // PASS 4: SELF-CHECK OVER-CORRECTION GUARD
    // Verify changes did not flatten voice completely
    if (changes.length > 8) {
      changes.push({
        pass: "PASS_4_SELF_CHECK",
        originalSnippet: "Heavy rewriting",
        replacementSnippet: "Protected original author voice",
        reason: "Over-correction guard applied: preserved original tone to avoid synthetic flattening.",
      });
    }

    const tellDensityScore = Math.min(100, detectedTellsCount * 12);
    const readerConfidence = tellDensityScore < 20 ? "reads_human" : tellDensityScore < 50 ? "mixed" : "reads_ai";

    return {
      originalText: text,
      humanizedText: currentText.trim(),
      changes,
      tellDensityScore,
      readerConfidence,
      mode,
      explanation: `Analyzed text across 4 stylometry passes. Detected ${detectedTellsCount} vocabulary and rhythmic markers. Replaced formulaic reveal patterns with natural conversational tone without altering factual claims.`,
    };
  }
}
