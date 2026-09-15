import { MutationResult } from "./docx-mutation-engine";

// ============================================================
// DocxOutputValidator
// Compares original vs edited DOCX and ensures ONLY approved
// changes caused differences. Prevents accidental data loss.
// ============================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  paragraphCountMatch: boolean;
  tableCountMatch: boolean;
  headingCountMatch: boolean;
  imageRelIdsMatch: boolean;
  numberingPreserved: boolean;
  stylesPreserved: boolean;
  textNodesDelta: number;
  overflowRisk: boolean;
  changeSummary: string;
}

export class DocxOutputValidator {
  static validate(mutation: MutationResult): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const v = mutation.validation;

    // Paragraph count must match
    const paragraphCountMatch = v.paragraphCountBefore === v.paragraphCountAfter;
    if (!paragraphCountMatch) {
      errors.push(
        `Paragraph count changed from ${v.paragraphCountBefore} to ${v.paragraphCountAfter}. ` +
        `This may indicate accidental content deletion.`
      );
    }

    // Table count must match
    const tableCountMatch = v.tableCountBefore === v.tableCountAfter;
    if (!tableCountMatch) {
      errors.push(
        `Table count changed from ${v.tableCountBefore} to ${v.tableCountAfter}. ` +
        `Tables must be preserved exactly.`
      );
    }

    // Heading count must match
    const headingCountMatch = v.headingCountBefore === v.headingCountAfter;
    if (!headingCountMatch) {
      warnings.push(
        `Heading count changed from ${v.headingCountBefore} to ${v.headingCountAfter}. ` +
        `Section structure may have shifted.`
      );
    }

    // Image relationship IDs must all still be present
    const imageRelIdsMatch = v.imageRelIdsBefore.every(id => v.imageRelIdsAfter.includes(id));
    if (!imageRelIdsMatch) {
      errors.push("One or more image relationship IDs were lost during editing. Images may be missing.");
    }

    const textNodesDelta = v.textNodesAfter - v.textNodesBefore;

    // Check for overflow risk (text significantly longer)
    const overflowRisk = textNodesDelta > 20;
    if (overflowRisk) {
      warnings.push(
        `The edited document has ${textNodesDelta} more text nodes than the original. ` +
        `Review for potential page overflow.`
      );
    }

    if (mutation.skipped.length > 0) {
      warnings.push(
        `${mutation.skipped.length} change(s) could not be applied: ` +
        mutation.skipped.map(s => s.reason).join("; ")
      );
    }

    const changeSummary = [
      `${mutation.applied.length} change(s) applied`,
      `${mutation.skipped.length} skipped`,
      `Paragraphs: ${v.paragraphCountBefore} → ${v.paragraphCountAfter}`,
      `Tables: ${v.tableCountBefore} → ${v.tableCountAfter}`,
      `Text nodes Δ: ${textNodesDelta >= 0 ? "+" : ""}${textNodesDelta}`,
    ].join(" | ");

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      paragraphCountMatch,
      tableCountMatch,
      headingCountMatch,
      imageRelIdsMatch,
      numberingPreserved: v.numberingXmlMatch,
      stylesPreserved: v.stylesXmlMatch,
      textNodesDelta,
      overflowRisk,
      changeSummary
    };
  }
}
