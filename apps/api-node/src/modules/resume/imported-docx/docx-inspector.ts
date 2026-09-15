import JSZip from "jszip";

// ============================================================
// DocxInspector
// Validates and unpacks a DOCX file (which is a ZIP/OOXML
// package) and returns its constituent XML parts.
// All security checks are performed here before any parsing.
// ============================================================

export interface DocxPackage {
  documentXml: string;
  stylesXml: string;
  numberingXml: string;
  settingsXml: string;
  fontTableXml: string;
  headers: Record<string, string>;   // { "word/header1.xml": "..." }
  footers: Record<string, string>;   // { "word/footer1.xml": "..." }
  relationships: string;             // word/_rels/document.xml.rels
  theme: string;                     // word/theme/theme1.xml (if present)
  contentTypes: string;              // [Content_Types].xml
  mediaFiles: string[];              // rel paths to images/media
  allPartNames: string[];            // all parts in the zip
}

export interface DocxInspectionResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  package?: DocxPackage;
}

const MAX_COMPRESSED_SIZE_BYTES = 10 * 1024 * 1024;   // 10 MB
const MAX_UNCOMPRESSED_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB (zip bomb guard)

export class DocxInspector {
  /**
   * Full validation + unpacking pipeline.
   * Call this ONCE per import; cache the result.
   */
  static async inspect(buffer: Buffer, filename: string): Promise<DocxInspectionResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Compressed size limit
    if (buffer.length > MAX_COMPRESSED_SIZE_BYTES) {
      return {
        valid: false,
        errors: [`File too large: ${Math.round(buffer.length / 1024 / 1024)}MB. Maximum is 10MB.`],
        warnings: []
      };
    }

    // 2. Extension check
    if (!filename.toLowerCase().endsWith(".docx")) {
      return {
        valid: false,
        errors: ["Only .docx files are supported for import."],
        warnings: []
      };
    }

    // 3. Magic bytes: ZIP files start with PK (0x50 0x4B)
    if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
      return {
        valid: false,
        errors: ["File does not appear to be a valid DOCX (not a ZIP package)."],
        warnings: []
      };
    }

    // 4. Unzip
    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(buffer);
    } catch (err: any) {
      return {
        valid: false,
        errors: [`Could not unzip file: ${err.message}`],
        warnings: []
      };
    }

    // 5. ZIP bomb guard — check sum of uncompressed sizes
    let totalUncompressed = 0;
    zip.forEach((_, file) => {
      if (!file.dir) {
        totalUncompressed += (file as any)._data?.uncompressedSize || 0;
      }
    });
    if (totalUncompressed > MAX_UNCOMPRESSED_SIZE_BYTES) {
      return {
        valid: false,
        errors: ["File is too large when uncompressed. Possible ZIP bomb — rejected."],
        warnings: []
      };
    }

    // 6. Require word/document.xml
    const documentXmlFile = zip.file("word/document.xml");
    if (!documentXmlFile) {
      return {
        valid: false,
        errors: ["Invalid DOCX: word/document.xml not found."],
        warnings: []
      };
    }

    // 7. Extract required parts
    const documentXml = await documentXmlFile.async("string");

    // 8. XML entity protection — reject DOCTYPE declarations (XXE)
    if (/<!DOCTYPE/i.test(documentXml)) {
      return {
        valid: false,
        errors: ["File contains a DOCTYPE declaration which is not permitted."],
        warnings: []
      };
    }

    // 9. Basic well-formedness check — must have w:body
    if (!documentXml.includes("<w:body") && !documentXml.includes("<w:body>")) {
      return {
        valid: false,
        errors: ["Invalid DOCX: word/document.xml does not contain a <w:body>."],
        warnings: []
      };
    }

    // 10. Extract optional parts safely
    const stylesXml = await this.readPart(zip, "word/styles.xml");
    const numberingXml = await this.readPart(zip, "word/numbering.xml");
    const settingsXml = await this.readPart(zip, "word/settings.xml");
    const fontTableXml = await this.readPart(zip, "word/fontTable.xml");
    const relationships = await this.readPart(zip, "word/_rels/document.xml.rels");
    const contentTypes = await this.readPart(zip, "[Content_Types].xml");
    const theme = await this.readFirstMatch(zip, /^word\/theme\/theme\d*\.xml$/);

    // 11. Find all headers and footers
    const headers: Record<string, string> = {};
    const footers: Record<string, string> = {};
    const allPartNames: string[] = [];
    const mediaFiles: string[] = [];

    zip.forEach((relativePath) => {
      allPartNames.push(relativePath);
      if (/^word\/header\d+\.xml$/.test(relativePath)) {
        headers[relativePath] = ""; // filled below
      }
      if (/^word\/footer\d+\.xml$/.test(relativePath)) {
        footers[relativePath] = ""; // filled below
      }
      if (/^word\/media\//.test(relativePath)) {
        mediaFiles.push(relativePath);
      }
    });

    for (const hKey of Object.keys(headers)) {
      headers[hKey] = (await this.readPart(zip, hKey)) ?? "";
    }
    for (const fKey of Object.keys(footers)) {
      footers[fKey] = (await this.readPart(zip, fKey)) ?? "";
    }

    if (Object.keys(headers).length === 0 && Object.keys(footers).length === 0) {
      // No headers/footers — fine
    }

    if (mediaFiles.length > 0) {
      warnings.push(`Document contains ${mediaFiles.length} image(s). Images are preserved but not directly editable.`);
    }

    if (!numberingXml) {
      // No numbering — document may not have lists
    }

    const pkg: DocxPackage = {
      documentXml,
      stylesXml: stylesXml || "",
      numberingXml: numberingXml || "",
      settingsXml: settingsXml || "",
      fontTableXml: fontTableXml || "",
      headers,
      footers,
      relationships: relationships || "",
      theme: theme || "",
      contentTypes: contentTypes || "",
      mediaFiles,
      allPartNames
    };

    return {
      valid: true,
      errors,
      warnings,
      package: pkg
    };
  }

  private static async readPart(zip: JSZip, path: string): Promise<string | null> {
    const file = zip.file(path);
    if (!file) return null;
    try {
      return await file.async("string");
    } catch {
      return null;
    }
  }

  private static async readFirstMatch(zip: JSZip, pattern: RegExp): Promise<string | null> {
    let result: string | null = null;
    const files = zip.file(pattern);
    if (files.length > 0) {
      try {
        result = await files[0].async("string");
      } catch {
        result = null;
      }
    }
    return result;
  }
}
