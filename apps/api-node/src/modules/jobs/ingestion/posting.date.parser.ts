/**
 * PostingDateParser — parses relative and absolute date strings from job boards
 * into UTC timestamps with a confidence level.
 *
 * Examples handled:
 *   "2 hours ago", "5h ago", "Just now", "Today", "Yesterday",
 *   "2 days ago", "3d ago", "1 week ago", "Sep 12", "September 12",
 *   "12 Sep 2026", "2026-09-12", ISO 8601 strings
 */
export class PostingDateParser {
  private static MONTHS: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    january: 0, february: 1, march: 2, april: 3, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
  };

  /**
   * Parse a date string from a job board into { date, confidence }.
   * @returns { date: Date | null, confidence: "high" | "medium" | "low" | "unknown" }
   */
  static parse(text: string | null | undefined): { date: Date | null; confidence: string } {
    if (!text) return { date: null, confidence: "unknown" };

    const s = text.trim().toLowerCase();
    const now = new Date();

    // ── ISO / standard date strings ────────────────────────────────────────
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const d = new Date(text.trim());
      if (!isNaN(d.getTime())) return { date: d, confidence: "high" };
    }

    // ── "Just now" / "Today" ──────────────────────────────────────────────
    if (/just now|moments? ago|a moment ago/.test(s)) {
      return { date: new Date(now.getTime() - 5 * 60 * 1000), confidence: "medium" };
    }

    if (/^today$/.test(s)) {
      const d = new Date(now);
      d.setHours(9, 0, 0, 0);
      return { date: d, confidence: "medium" };
    }

    if (/^yesterday$/.test(s)) {
      const d = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      d.setHours(9, 0, 0, 0);
      return { date: d, confidence: "medium" };
    }

    // ── "X minutes ago" ───────────────────────────────────────────────────
    let m = s.match(/(\d+)\s*(?:minute?s?|min)\s*ago/);
    if (m) return { date: new Date(now.getTime() - parseInt(m[1]) * 60 * 1000), confidence: "high" };

    // ── "X hours ago" / "Xh ago" ──────────────────────────────────────────
    m = s.match(/(\d+)\s*(?:hours?|hrs?|h)\s*ago/);
    if (m) return { date: new Date(now.getTime() - parseInt(m[1]) * 60 * 60 * 1000), confidence: "high" };

    // ── "X days ago" / "Xd ago" ───────────────────────────────────────────
    m = s.match(/(\d+)\s*(?:days?|d)\s*ago/);
    if (m) return { date: new Date(now.getTime() - parseInt(m[1]) * 24 * 60 * 60 * 1000), confidence: "high" };

    // ── "X weeks ago" / "Xw ago" ──────────────────────────────────────────
    m = s.match(/(\d+)\s*(?:weeks?|wks?|w)\s*ago/);
    if (m) return { date: new Date(now.getTime() - parseInt(m[1]) * 7 * 24 * 60 * 60 * 1000), confidence: "medium" };

    // ── "X months ago" ────────────────────────────────────────────────────
    m = s.match(/(\d+)\s*(?:months?|mo)\s*ago/);
    if (m) return { date: new Date(now.getTime() - parseInt(m[1]) * 30 * 24 * 60 * 60 * 1000), confidence: "low" };

    // ── "a day ago" / "an hour ago" ───────────────────────────────────────
    m = s.match(/^an?\s*(hour|day|week|month)\s*ago$/);
    if (m) {
      const unit = m[1];
      const ms = unit === "hour" ? 60 * 60 * 1000 : unit === "day" ? 86400000 : unit === "week" ? 7 * 86400000 : 30 * 86400000;
      return { date: new Date(now.getTime() - ms), confidence: "medium" };
    }

    // ── "Posted X days ago" (with prefix) ─────────────────────────────────
    const stripped = s.replace(/^(?:posted|updated|listed|added|active)\s*/i, "");
    if (stripped !== s) return this.parse(stripped);

    // ── "Sep 12" / "12 Sep" / "September 12" / "12 September 2026" ────────
    m = s.match(/([a-z]+)\s+(\d{1,2})(?:[,\s]+(\d{4}))?/);
    if (m && this.MONTHS[m[1]] !== undefined) {
      const month = this.MONTHS[m[1]];
      const day = parseInt(m[2]);
      const year = m[3] ? parseInt(m[3]) : now.getFullYear();
      const d = new Date(year, month, day, 9, 0, 0, 0);
      if (!isNaN(d.getTime())) return { date: d, confidence: "medium" };
    }

    m = s.match(/(\d{1,2})\s+([a-z]+)(?:[,\s]+(\d{4}))?/);
    if (m && this.MONTHS[m[2]] !== undefined) {
      const month = this.MONTHS[m[2]];
      const day = parseInt(m[1]);
      const year = m[3] ? parseInt(m[3]) : now.getFullYear();
      const d = new Date(year, month, day, 9, 0, 0, 0);
      if (!isNaN(d.getTime())) return { date: d, confidence: "medium" };
    }

    // ── "DD/MM/YYYY" or "MM/DD/YYYY" ──────────────────────────────────────
    m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) {
      // Assume DD/MM/YYYY for India
      const d = new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]), 9, 0, 0);
      if (!isNaN(d.getTime())) return { date: d, confidence: "medium" };
    }

    // ── Failed to parse ────────────────────────────────────────────────────
    return { date: null, confidence: "unknown" };
  }

  /**
   * Convert hoursDiff to freshness bucket
   */
  static freshnessFromHours(hoursDiff: number): string {
    if (hoursDiff <= 6) return "FRESH_0_6H";
    if (hoursDiff <= 12) return "FRESH_6_12H";
    if (hoursDiff <= 24) return "FRESH_12_24H";
    if (hoursDiff <= 48) return "FRESH_24_48H";
    return "STALE";
  }
}
