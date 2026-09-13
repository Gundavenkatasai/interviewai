import { AIService } from "../../../ai/ai.service";
import { ATSReport, ATSIssue } from "../ats-engine/ats.evaluator";
import { IOptimizationPlan, IOptimizationProposal } from "./optimization.types";
import { OptimizationValidator } from "./optimization.validator";
import { IDocxStructureMap } from "../docx-engine/docx.types";
import { StructurePreservingDocxGenerator } from "../docx-engine/structure-preserver";
import { randomUUID } from "crypto";

export class OptimizationService {
  /**
   * Generate evidence-grounded optimization proposals addressing real ATS issues
   */
  public static async generatePlan(params: {
    resumeId: string;
    resumeText: string;
    atsReport: ATSReport;
    structureMap?: IDocxStructureMap;
    jdText?: string;
    targetRole?: string;
    verifiedSkills?: string[];
    knownCompanies?: string[];
    knownTitles?: string[];
  }): Promise<IOptimizationPlan> {
    const {
      resumeId,
      resumeText,
      atsReport,
      structureMap,
      jdText = "",
      targetRole = "Software Engineer",
      verifiedSkills = [],
      knownCompanies = [],
      knownTitles = []
    } = params;

    // Collect targeted issues (focus on actionable issues with suggestions)
    const actionableIssues = (atsReport.issues || [])
      .filter((i) => i.severity === "critical" || i.severity === "high" || i.severity === "medium")
      .slice(0, 8);

    // Bullets to optimize (either from DOCX structure map, AST, or text line extraction)
    let bulletCandidates: Array<{ section: string; roleIndex: number; bulletIndex: number; text: string }> = [];
    if (structureMap?.bullets?.length) {
      bulletCandidates = structureMap.bullets.slice(0, 15);
    } else {
      try {
        const ast = StructurePreservingDocxGenerator.parse(resumeText);
        let roleIdx = 0;
        for (const sec of ast.sections) {
          let bIdx = 0;
          for (const it of sec.items) {
            if (it.type === "bullet" && it.rawText && it.rawText.trim().length > 15) {
              bulletCandidates.push({
                section: sec.heading,
                roleIndex: roleIdx,
                bulletIndex: bIdx++,
                text: it.rawText.trim()
              });
            }
          }
          roleIdx++;
        }
      } catch (err) {
        console.warn("[OptimizationService] AST bullet extraction warning:", err);
      }
      if (bulletCandidates.length === 0) {
        bulletCandidates = this.extractBulletLinesFromText(resumeText).slice(0, 15);
      }
    }

    // Candidate skills available
    const availableSkills = Array.from(
      new Set([
        ...verifiedSkills,
        ...(atsReport.keywordRes?.techFound || []),
        ...(atsReport.keywordRes?.matched || [])
      ])
    ).filter(Boolean);

    // Prepare prompt
    const actionableIssuesText = actionableIssues
      .map((issue) => `[${issue.id || "ATS-???"}] [${issue.severity.toUpperCase()}] ${issue.title}: ${issue.why} -> Fix: ${issue.suggestion}`)
      .join("\n");

    const prompt = `You are a precision ATS resume optimization engine.
Analyze the candidate's ACTUAL resume text and the REAL ATS issues detected by the deterministic ATS scanner.
Generate targeted, format-preserving text replacements ONLY for the weakest bullets to improve ATS compatibility.

STRICT ANTI-HALLUCINATION & FACT PRESERVATION RULES:
1. NEVER INVENT METRICS: If source says "Optimized database queries", do NOT write "Optimized database queries by 45%" unless "45%" is explicitly in the source.
2. NEVER INVENT FACTS: Do NOT add new companies, dates, certifications, degrees, or job titles.
3. PRESERVE PROTECTED FIELDS: Company names, dates, job titles, and institutions must remain untouched.
4. EVIDENCE GROUNDED: Every change must be grounded in the verified candidate skills: ${availableSkills.slice(0, 15).join(", ") || "General Engineering"}.
5. TARGETED REPLACEMENTS ONLY: Do NOT rewrite the entire resume. Provide replacements for 3 to 6 specific bullets.
6. USE ONLY VERIFIED SKILLS: Only reference skills from the evidence list. Do not introduce frameworks, tools, or technologies not verified.

DETECTED ATS ISSUES (Use these exact IDs in issueIds field):
${actionableIssuesText || "No critical issues detected — use bullet quality improvements from the evidence list."}

TARGET BULLET CANDIDATES:
${bulletCandidates
  .map(
    (b, idx) =>
      `[Target ${idx}] Section: "${b.section}", Text: "${b.text}"`
  )
  .join("\n")}

${jdText ? `TARGET JOB DESCRIPTION HIGHLIGHTS:\n${jdText.slice(0, 600)}` : ""}

Return valid JSON with this EXACT structure:
{
  "proposals": [
    {
      "id": "opt-1",
      "section": "Experience",
      "targetId": "0",
      "originalText": "exact text of candidate bullet",
      "proposedText": "improved version starting with strong action verb, front-loading technical keywords, without inventing numbers",
      "reason": "Replaces weak verb and aligns technical keyword with ATS requirements",
      "evidence": ["Node.js", "Docker"],
      "issueIds": ["ATS-001", "ATS-003"],
      "unsupportedClaims": [],
      "risk": "low"
    }
  ]
}`;


    let rawProposals: IOptimizationProposal[] = [];

    try {
      const response = await AIService.generateStructured<{ proposals: IOptimizationProposal[] }>(
        [{ role: "user", content: prompt }],
        {},
        "qwen"
      );

      if (response && Array.isArray(response.proposals) && response.proposals.length > 0) {
        rawProposals = response.proposals.map((p, idx) => {
          const matchedBullet = bulletCandidates.find(
            (b, bIdx) =>
              bIdx === Number(p.targetId) ||
              b.text.toLowerCase().includes(p.originalText.trim().toLowerCase().slice(0, 25))
          );

          return {
            id: p.id || `prop-${idx + 1}-${randomUUID().slice(0, 4)}`,
            section: matchedBullet?.section || p.section || "Experience",
            targetId: String(matchedBullet ? bulletCandidates.indexOf(matchedBullet) : idx),
            roleIndex: matchedBullet?.roleIndex ?? 0,
            bulletIndex: matchedBullet?.bulletIndex ?? idx,
            originalText: matchedBullet?.text || p.originalText,
            proposedText: p.proposedText,
            reason: p.reason || "Improves technical keyword context and active verb clarity",
            evidence: Array.isArray(p.evidence) && p.evidence.length > 0 ? p.evidence : ["Document verified context"],
            issueIds: Array.isArray(p.issueIds) ? p.issueIds : ["ats_improvement"],
            unsupportedClaims: Array.isArray(p.unsupportedClaims) ? p.unsupportedClaims : [],
            risk: p.risk || "low"
          };
        });
      }
    } catch (err) {
      console.warn("[OptimizationService] LLM structured call failed or offline, using deterministic fallback:", err);
    }

    // Deterministic fallback if LLM returned nothing
    if (rawProposals.length === 0) {
      rawProposals = this.generateDeterministicFallbacks(bulletCandidates, actionableIssues, availableSkills);
    }

    // Run deterministic anti-hallucination validation
    let { validProposals } = OptimizationValidator.filterValidProposals(rawProposals, {
      knownCompanies,
      knownTitles,
      candidateSkills: availableSkills
    });

    // Guarantee valid proposals if validator filtered out LLM proposals
    if (validProposals.length === 0 && bulletCandidates.length > 0) {
      const guaranteed = this.generateDeterministicFallbacks(bulletCandidates, actionableIssues, availableSkills);
      const rechecked = OptimizationValidator.filterValidProposals(guaranteed, {
        knownCompanies,
        knownTitles,
        candidateSkills: availableSkills
      });
      validProposals = rechecked.validProposals;
    }

    return {
      resumeId,
      targetRole,
      proposals: validProposals,
      atsIssuesAddressed: actionableIssues.length,
      verifiedSkillsUsed: availableSkills,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Helper: Extract bullet lines from plain text if DOCX structure map is not available
   */
  private static extractBulletLinesFromText(text: string): Array<{ section: string; roleIndex: number; bulletIndex: number; text: string }> {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const bullets: Array<{ section: string; roleIndex: number; bulletIndex: number; text: string }> = [];
    let currentSection = "Experience";
    let roleIdx = 0;
    let bulletIdx = 0;

    for (const line of lines) {
      if (/^[A-Z\s]{4,30}$/.test(line)) {
        currentSection = line;
        bulletIdx = 0;
        continue;
      }
      if (/^[•·\*\-–—▪▫◦]\s+/.test(line) || (line.length > 30 && /^[A-Z][a-z]+/.test(line))) {
        const clean = line.replace(/^[•·\*\-–—▪▫◦]\s*/, "").trim();
        if (clean.length > 15) {
          bullets.push({
            section: currentSection,
            roleIndex: roleIdx,
            bulletIndex: bulletIdx++,
            text: clean
          });
        }
      }
    }

    return bullets;
  }

  /**
   * Deterministic fallback when LLM is offline or rate-limited:
   * Fixes weak action verbs, upgrades passive structure, and aligns technical keyword context without hallucination
   */
  private static generateDeterministicFallbacks(
    bullets: Array<{ section: string; roleIndex: number; bulletIndex: number; text: string }>,
    issues: ATSIssue[],
    skills: string[]
  ): IOptimizationProposal[] {
    const proposals: IOptimizationProposal[] = [];
    const weakVerbReplacements: Record<string, string> = {
      worked: "Engineered",
      helped: "Facilitated",
      assisted: "Collaborated to deliver",
      handled: "Orchestrated",
      did: "Executed",
      tried: "Implemented",
      participated: "Contributed to",
      made: "Architected",
      added: "Engineered",
      built: "Architected",
      created: "Developed",
      used: "Leveraged",
      designed: "Architected",
      automated: "Streamlined automated",
      developed: "Engineered and deployed",
      implemented: "Configured and implemented"
    };

    for (let i = 0; i < Math.min(bullets.length, 6); i++) {
      const b = bullets[i];
      let improved = b.text;
      let reason = "";

      for (const [weak, strong] of Object.entries(weakVerbReplacements)) {
        const regex = new RegExp(`^${weak}\\b`, "i");
        if (regex.test(improved)) {
          improved = improved.replace(regex, strong);
          reason = `Replaced opening verb "${weak}" with high-impact active verb "${strong}" for ATS scoring`;
          break;
        }
      }

      if (improved !== b.text) {
        proposals.push({
          id: `det-${i + 1}`,
          section: b.section,
          targetId: String(i),
          roleIndex: b.roleIndex,
          bulletIndex: b.bulletIndex,
          originalText: b.text,
          proposedText: improved,
          reason,
          evidence: ["Original resume text", ...skills.slice(0, 3)],
          issueIds: ["weak_action_verbs", "ats_improvement"],
          unsupportedClaims: [],
          risk: "low"
        });
      }
    }

    // If weakVerbReplacements produced 0 proposals, formulate grounded active improvements
    if (proposals.length === 0 && bullets.length > 0) {
      for (let i = 0; i < Math.min(bullets.length, 4); i++) {
        const b = bullets[i];
        const words = b.text.split(/\s+/);
        const firstWord = words[0] || "";
        const rest = words.slice(1).join(" ");
        let proposed = b.text;

        if (/^[A-Z][a-z]+ed$/i.test(firstWord)) {
          proposed = `Architected and ${firstWord.toLowerCase()} ${rest}`;
        } else {
          proposed = `Engineered ${b.text.charAt(0).toLowerCase() + b.text.slice(1)}`;
        }

        proposals.push({
          id: `det-grounded-${i + 1}`,
          section: b.section,
          targetId: String(i),
          roleIndex: b.roleIndex,
          bulletIndex: b.bulletIndex,
          originalText: b.text,
          proposedText: proposed,
          reason: `Enhances active voice leadership and ATS keyword context`,
          evidence: ["Verified resume text", ...skills.slice(0, 2)],
          issueIds: ["ats_action_verbs"],
          unsupportedClaims: [],
          risk: "low"
        });
      }
    }

    return proposals;
  }
}
