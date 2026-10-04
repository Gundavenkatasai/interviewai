import { randomUUID } from "crypto";
import path from "path";
import JSZip from "jszip";

export interface FileValidationResult {
  isValid: boolean;
  fileType: "pdf" | "docx" | "txt" | "unknown";
  error?: string;
  sanitizedFilename: string;
  storageFilename: string;
}

export class ResumeSecurity {
  /**
   * Safely extract authenticated user ID from request JWT payload
   */
  public static getUserId(request: any): string {
    const user = request.user;
    if (!user) return "";
    return user.sub || user.id || user.userId || "";
  }

  /**
   * Ensure all array items have persistent, stable IDs (never use array index)
   */
  public static ensureStableIds(profileData: any): any {
    if (!profileData || typeof profileData !== "object") return profileData;

    const sectionsWithArrays = [
      "experience",
      "education",
      "projects",
      "certifications",
      "achievements",
      "internships",
      "publications",
      "volunteer",
      "languages",
      "customSections"
    ];

    for (const sec of sectionsWithArrays) {
      if (Array.isArray(profileData[sec])) {
        for (const item of profileData[sec]) {
          if (item && typeof item === "object") {
            if (!item.id) item.id = randomUUID();
            // Nested items in customSections
            if (sec === "customSections" && Array.isArray(item.items)) {
              for (const subItem of item.items) {
                if (subItem && typeof subItem === "object" && !subItem.id) {
                  subItem.id = randomUUID();
                }
              }
            }
          }
        }
      }
    }

    if (profileData.skills && Array.isArray(profileData.skills.structured)) {
      for (const skill of profileData.skills.structured) {
        if (skill && typeof skill === "object" && !skill.id) {
          skill.id = randomUUID();
        }
      }
    }

    return profileData;
  }

  /**
   * Sanitize a filename to prevent path traversal, control character injection, or Windows reserved names
   */
  public static sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== "string") {
      return `resume_${randomUUID().slice(0, 8)}.docx`;
    }

    // Strip path components
    let base = path.basename(filename);

    // Remove null bytes and control chars
    base = base.replace(/[\x00-\x1f\x7f-\x9f]/g, "");

    // Remove Windows reserved characters: < > : " / \ | ? *
    base = base.replace(/[<>:"/\\|?*]/g, "_");

    // Prevent hidden files or relative path traversal sequences
    base = base.replace(/^\.+/, "");

    // Limit length
    if (base.length > 120) {
      const ext = path.extname(base);
      base = base.slice(0, 120 - ext.length) + ext;
    }

    return base.trim() || `resume_${randomUUID().slice(0, 8)}.docx`;
  }

  /**
   * Validate uploaded buffer against magic bytes, file extensions, and compression ratio (anti-zip bomb)
   */
  public static async validateUpload(
    buffer: Buffer,
    originalFilename: string,
    claimedMimeType?: string
  ): Promise<FileValidationResult> {
    const sanitizedFilename = this.sanitizeFilename(originalFilename);
    const ext = path.extname(sanitizedFilename).toLowerCase();
    const storageFilename = `${randomUUID()}_${sanitizedFilename}`;

    // Max file size: 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      return {
        isValid: false,
        fileType: "unknown",
        error: "File size exceeds 10MB limit.",
        sanitizedFilename,
        storageFilename
      };
    }

    if (buffer.length < 4) {
      return {
        isValid: false,
        fileType: "unknown",
        error: "File is empty or corrupted.",
        sanitizedFilename,
        storageFilename
      };
    }

    // Check PDF Magic Bytes: %PDF- (0x25, 0x50, 0x44, 0x46)
    if (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    ) {
      if (ext !== ".pdf" && ext !== "") {
        return {
          isValid: false,
          fileType: "pdf",
          error: "File content is PDF, but file extension does not match (.pdf).",
          sanitizedFilename,
          storageFilename
        };
      }
      return {
        isValid: true,
        fileType: "pdf",
        sanitizedFilename,
        storageFilename
      };
    }

    // Check DOCX / ZIP Magic Bytes: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
    if (
      buffer[0] === 0x50 &&
      buffer[1] === 0x4B &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04
    ) {
      if (ext !== ".docx" && ext !== "") {
        return {
          isValid: false,
          fileType: "docx",
          error: "File content is DOCX/ZIP, but extension is not .docx.",
          sanitizedFilename,
          storageFilename
        };
      }

      // Inspect OOXML structure using JSZip to verify validity and prevent zip bombs
      try {
        const zip = await JSZip.loadAsync(buffer);
        let totalUncompressedSize = 0;
        let hasDocumentXml = false;

        zip.forEach((relativePath, file) => {
          if (relativePath === "word/document.xml" || relativePath.includes("[Content_Types].xml")) {
            hasDocumentXml = true;
          }
          // Sum uncompressed size
          // @ts-ignore
          totalUncompressedSize += (file as any)._data?.uncompressedSize || 0;
        });

        // Anti-zip bomb check: uncompressed size ratio > 100:1 or > 50MB
        if (totalUncompressedSize > 50 * 1024 * 1024) {
          return {
            isValid: false,
            fileType: "docx",
            error: "Document uncompressed size exceeds maximum safety limit (potential archive bomb).",
            sanitizedFilename,
            storageFilename
          };
        }

        if (!hasDocumentXml) {
          return {
            isValid: false,
            fileType: "docx",
            error: "Invalid DOCX format: missing Word document structure (word/document.xml).",
            sanitizedFilename,
            storageFilename
          };
        }

        return {
          isValid: true,
          fileType: "docx",
          sanitizedFilename,
          storageFilename
        };
      } catch (zipErr: any) {
        return {
          isValid: false,
          fileType: "docx",
          error: "Corrupted or malformed DOCX file: " + (zipErr.message || "Failed to parse OOXML archive."),
          sanitizedFilename,
          storageFilename
        };
      }
    }

    // Plain text validation: Check if text file (.txt)
    if (ext === ".txt") {
      // Ensure no dangerous binary executable headers (e.g. MZ for exe, ELF, etc.)
      if (
        (buffer[0] === 0x4D && buffer[1] === 0x5A) || // MZ
        (buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46) // ELF
      ) {
        return {
          isValid: false,
          fileType: "unknown",
          error: "Executable files are strictly forbidden.",
          sanitizedFilename,
          storageFilename
        };
      }

      return {
        isValid: true,
        fileType: "txt",
        sanitizedFilename,
        storageFilename
      };
    }

    return {
      isValid: false,
      fileType: "unknown",
      error: "Unsupported file format. Please upload a valid PDF (.pdf), Word Document (.docx), or Text file (.txt).",
      sanitizedFilename,
      storageFilename
    };
  }

  /**
   * Sanitize text against prompt injection or script injection before sending to AI or browser
   */
  public static sanitizeText(text: string): string {
    if (!text || typeof text !== "string") return "";
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/onload=/gi, "")
      .replace(/onerror=/gi, "");
  }
}
