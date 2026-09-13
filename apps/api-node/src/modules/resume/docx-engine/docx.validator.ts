import { IDocxStructureMap } from "./docx.types";

export interface IValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  bulletCountMatch: boolean;
  sectionOrderMatch: boolean;
  charDelta: number;
  percentageChange: number;
}

export class DocxValidator {
  /**
   * Validate structural and visual preservation between original and modified documents
   */
  public static validatePreservation(
    mapBefore: IDocxStructureMap,
    mapAfter: IDocxStructureMap,
    originalText: string,
    modifiedText: string
  ): IValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Bullet Count Preservation
    const bulletCountMatch = mapBefore.bulletCount === mapAfter.bulletCount;
    if (!bulletCountMatch) {
      errors.push(
        `Bullet count changed from ${mapBefore.bulletCount} to ${mapAfter.bulletCount}. Must remain identical.`
      );
    }

    // 2. Section Headings Preservation
    const sectionOrderMatch =
      mapBefore.headings.length === mapAfter.headings.length &&
      mapBefore.headings.every((h, i) => h.toLowerCase() === mapAfter.headings[i]?.toLowerCase());

    if (!sectionOrderMatch) {
      errors.push("Document sections or heading sequence was unintentionally altered.");
    }

    // 3. Document Length / Character Delta Check
    const charBefore = originalText.trim().length;
    const charAfter = modifiedText.trim().length;
    const charDelta = charAfter - charBefore;
    const percentageChange = charBefore > 0 ? Math.round((charDelta / charBefore) * 100) : 0;

    // A change of >25% risks page overflow in a fixed-grid resume
    if (percentageChange > 25) {
      warnings.push(
        `Optimized content is ${percentageChange}% longer (${charDelta} characters added), which may cause page overflow on tight margins.`
      );
    } else if (percentageChange < -30) {
      warnings.push(
        `Optimized content is ${Math.abs(percentageChange)}% shorter, which may create unexpected blank whitespace.`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      bulletCountMatch,
      sectionOrderMatch,
      charDelta,
      percentageChange
    };
  }
}
