export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  component?: string;
  [key: string]: any;
}

const REDACT_KEYS = new Set([
  "password",
  "token",
  "jwt",
  "secret",
  "authorization",
  "cookie",
  "apikey",
  "key",
]);

function redact(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(redact);
  const copy: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (REDACT_KEYS.has(k.toLowerCase())) {
      copy[k] = "[REDACTED]";
    } else if (typeof v === "object") {
      copy[k] = redact(v);
    } else {
      copy[k] = v;
    }
  }
  return copy;
}

export class AppLogger {
  constructor(private context: LogContext = {}) {}

  with(context: LogContext): AppLogger {
    return new AppLogger({ ...this.context, ...context });
  }

  private log(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      level,
      message,
      ...this.context,
      ...(meta ? { meta: redact(meta) } : {}),
    };
    if (level === "error") {
      console.error(JSON.stringify(payload));
    } else if (level === "warn") {
      console.warn(JSON.stringify(payload));
    } else {
      console.log(JSON.stringify(payload));
    }
  }

  debug(msg: string, meta?: any) {
    if (process.env.NODE_ENV !== "production") {
      this.log("debug", msg, meta);
    }
  }

  info(msg: string, meta?: any) {
    this.log("info", msg, meta);
  }

  warn(msg: string, meta?: any) {
    this.log("warn", msg, meta);
  }

  error(msg: string, meta?: any) {
    this.log("error", msg, meta);
  }
}

export const logger = new AppLogger({ component: "InterviewAI" });
