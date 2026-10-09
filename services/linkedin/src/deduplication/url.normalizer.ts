import { InvalidUrlError, SecurityViolationError } from "../core/errors";

export interface NormalizedLinkedInUrl {
  canonicalUrl: string;
  kind: "profile" | "job" | "company" | "post" | "unknown";
  identifier: string; // username, jobId, companySlug, activityId
}

export class UrlNormalizer {
  private static readonly BLOCKED_HOSTS = new Set([
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "169.254.169.254", // AWS/Cloud metadata
  ]);

  /**
   * Strictly canonicalizes and validates LinkedIn URLs against SSRF
   */
  static normalize(rawUrl: string): NormalizedLinkedInUrl {
    if (!rawUrl || typeof rawUrl !== "string") {
      throw new InvalidUrlError("Profile URL cannot be empty.", rawUrl || "");
    }

    const trimmed = rawUrl.trim();
    let parsed: URL;

    try {
      parsed = new URL(trimmed);
    } catch {
      // If user provided username only like "satyanadella" or "in/satyanadella"
      if (!trimmed.includes("://") && /^[a-zA-Z0-9_\-\/]+$/.test(trimmed)) {
        const cleanUsername = trimmed.replace(/^in\//, "").replace(/\/$/, "");
        return {
          canonicalUrl: `https://www.linkedin.com/in/${cleanUsername.toLowerCase()}/`,
          kind: "profile",
          identifier: cleanUsername.toLowerCase(),
        };
      }
      throw new InvalidUrlError(`Invalid URL format: ${rawUrl}`, rawUrl);
    }

    // SSRF Check 1: HTTPS only
    if (parsed.protocol !== "https:") {
      throw new SecurityViolationError("Only secure HTTPS URLs are permitted.", parsed.hostname);
    }

    // SSRF Check 2: Domain verification
    const host = parsed.hostname.toLowerCase();
    if (
      this.BLOCKED_HOSTS.has(host) ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("172.16.") ||
      host.startsWith("172.31.")
    ) {
      throw new SecurityViolationError("Access to internal/private host is strictly prohibited.", host);
    }

    const isLinkedIn = host === "linkedin.com" || host.endsWith(".linkedin.com");
    if (!isLinkedIn) {
      throw new InvalidUrlError("URL host must be on linkedin.com", rawUrl);
    }

    const pathname = parsed.pathname.replace(/\/+/g, "/");

    // Profile URL: /in/<username>
    if (pathname.startsWith("/in/")) {
      const parts = pathname.split("/").filter(Boolean);
      const username = (parts[1] || "").toLowerCase().replace(/[^a-z0-9_-]/g, "");
      if (!username) {
        throw new InvalidUrlError("LinkedIn profile URL is missing a valid username path.", rawUrl);
      }
      return {
        canonicalUrl: `https://www.linkedin.com/in/${username}/`,
        kind: "profile",
        identifier: username,
      };
    }

    // Job URL: /jobs/view/<jobId>
    if (pathname.startsWith("/jobs/view/")) {
      const parts = pathname.split("/").filter(Boolean);
      const jobId = parts[2] || parts[1] || "";
      return {
        canonicalUrl: `https://www.linkedin.com/jobs/view/${jobId}/`,
        kind: "job",
        identifier: jobId,
      };
    }

    // Company URL: /company/<slug>
    if (pathname.startsWith("/company/")) {
      const parts = pathname.split("/").filter(Boolean);
      const slug = (parts[1] || "").toLowerCase();
      return {
        canonicalUrl: `https://www.linkedin.com/company/${slug}/`,
        kind: "company",
        identifier: slug,
      };
    }

    // Post Activity: /feed/update/urn:li:activity:<id>
    if (pathname.includes("urn:li:activity:") || pathname.startsWith("/posts/")) {
      const match = pathname.match(/urn:li:activity:(\d+)/) || pathname.match(/\/posts\/([a-zA-Z0-9_-]+)/);
      const id = match ? match[1] : "post";
      return {
        canonicalUrl: `https://www.linkedin.com/feed/update/urn:li:activity:${id}/`,
        kind: "post",
        identifier: id,
      };
    }

    return {
      canonicalUrl: `https://www.linkedin.com${pathname}`,
      kind: "unknown",
      identifier: pathname,
    };
  }
}
