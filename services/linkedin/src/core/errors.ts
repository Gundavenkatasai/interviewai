/**
 * Standardized Error Classes for the LinkedIn Subsystem
 */

export type LinkedInErrorCode =
  | "AUTH_WALL_ENCOUNTERED"
  | "RATE_LIMIT_EXCEEDED"
  | "INVALID_PROFILE_URL"
  | "SSRF_ATTEMPT_BLOCKED"
  | "SELECTOR_EXTRACTION_FAILED"
  | "CIRCUIT_BREAKER_OPEN"
  | "UNSUPPORTED_PROVIDER_CAPABILITY"
  | "RESOURCE_NOT_FOUND"
  | "EMPTY_EXTRACTION_RESULT"
  | "PROMPT_INJECTION_DETECTED"
  | "TIMEOUT_EXCEEDED";

export class LinkedInBaseError extends Error {
  constructor(
    public readonly code: LinkedInErrorCode,
    message: string,
    public readonly providerName: string = "system",
    public readonly recoverable: boolean = false,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthWallError extends LinkedInBaseError {
  constructor(providerName: string, url: string) {
    super(
      "AUTH_WALL_ENCOUNTERED",
      `LinkedIn presented an authentication login wall or CAPTCHA for URL: ${url}. Public scraping requires unauthenticated page access or manual input fallback.`,
      providerName,
      false,
      { url }
    );
  }
}

export class RateLimitError extends LinkedInBaseError {
  constructor(providerName: string, retryAfterSeconds?: number) {
    super(
      "RATE_LIMIT_EXCEEDED",
      `Provider ${providerName} is temporarily rate-limited by LinkedIn. Retry recommended in ${retryAfterSeconds || 60} seconds.`,
      providerName,
      true,
      { retryAfterSeconds }
    );
  }
}

export class InvalidUrlError extends LinkedInBaseError {
  constructor(message: string, url: string) {
    super("INVALID_PROFILE_URL", message, "validator", false, { url });
  }
}

export class SecurityViolationError extends LinkedInBaseError {
  constructor(message: string, ipOrHost: string) {
    super("SSRF_ATTEMPT_BLOCKED", message, "security", false, { ipOrHost });
  }
}

export class CircuitBreakerOpenError extends LinkedInBaseError {
  constructor(providerName: string, consecutiveFailures: number) {
    super(
      "CIRCUIT_BREAKER_OPEN",
      `Circuit breaker active for ${providerName} after ${consecutiveFailures} consecutive failures. Temporarily diverting requests.`,
      providerName,
      true,
      { consecutiveFailures }
    );
  }
}
