import { createHash } from "crypto";

export class ContentHasher {
  /**
   * Generates a deterministic SHA-256 hash of raw extracted text or object payload
   */
  static hash(content: string | Record<string, any>): string {
    const raw = typeof content === "string" ? content : JSON.stringify(content);
    return createHash("sha256").update(raw.trim()).digest("hex");
  }

  /**
   * Generates versioned cache key
   */
  static generateCacheKey(prefix: string, identifier: string, version: string = "v1"): string {
    const sanitizedId = identifier.replace(/[^a-zA-Z0-9_-]/g, "_");
    return `linkedin:${prefix}:${version}:${sanitizedId}`;
  }
}
