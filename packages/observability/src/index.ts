import crypto from "crypto";

export function generateCorrelationId(): string {
  return crypto.randomUUID();
}

export interface MetricEntry {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: string;
}

export class MetricsCollector {
  private buffer: MetricEntry[] = [];

  record(name: string, value: number, tags?: Record<string, string>) {
    this.buffer.push({
      name,
      value,
      tags,
      timestamp: new Date().toISOString(),
    });
    if (this.buffer.length > 1000) {
      this.buffer.shift();
    }
  }

  getMetrics(): MetricEntry[] {
    return [...this.buffer];
  }

  clear() {
    this.buffer = [];
  }
}

export const metrics = new MetricsCollector();
