# LinkedIn Scraping & Data Extraction Architecture

## 1. Ethical & Platform Compliance Mandates
1. **Zero Authentication Bypass**:
   - No session cookie harvesting (`li_at`, `JSESSIONID`).
   - No password cracking, stored credentials, or authentication wall circumvention.
   - No CAPTCHA solving or fingerprint evasions designed to defeat platform controls.
2. **Truthful Error Handling**:
   - If an authwall or CAPTCHA is encountered, providers throw an `AuthWallError`.
   - Never fabricate data, placeholder statistics, or artificial profiles when a request is blocked.
3. **SSRF Defense**:
   - Target URLs are strictly validated against private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.1`, `::1`, and cloud metadata `169.254.169.254`).
   - Only `https://www.linkedin.com/*` or valid usernames are accepted.

---

## 2. Browser Service & Lifecycle Management
For providers utilizing browser automation (`playwright_browser`):
- **Singleton Browser Instance**: Prevents launching isolated Chromium processes per HTTP request.
- **Bounded Concurrency**: Maximum 2 concurrent browser contexts/pages at any moment. Additional requests queue gracefully with timeout rejection.
- **Resource Cleanup**: Pages close in a `finally` block with `page.close()` to prevent memory leaks.
- **Safe Navigation**: Scripts enforce timeouts (15,000ms navigation, 10,000ms selector wait).

---

## 3. Data Normalization & Sanitization
All raw HTML and scraped text pass through `ProfileNormalizer`, `PostNormalizer`, and `JobNormalizer`:
- **HTML Stripping**: Cheerio cleans all markup tags before text extraction.
- **Prompt Injection Defense**: Neutralizes delimiters such as `system prompt`, `system instruction`, and `ignore all previous instructions` with `[REDACTED]`.
- **Deduplication**: Computes SHA-256 `contentHash` on normalized records and caches snapshots to prevent redundant network fetches.
