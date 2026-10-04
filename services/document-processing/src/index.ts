/**
 * @interview-ai/document-processing
 * Production DOCX/PDF Extraction, Validation, and Mutation Service
 */

export interface ParsedDocumentResult {
  text: string;
  metadata: {
    format: "PDF" | "DOCX" | "UNKNOWN";
    pageCount?: number;
    wordCount: number;
    hasFormatting: boolean;
  };
}

export class DocumentParser {
  static validateExtension(fileName: string): boolean {
    const ext = fileName.split(".").pop()?.toLowerCase();
    return ext === "pdf" || ext === "docx";
  }
}
