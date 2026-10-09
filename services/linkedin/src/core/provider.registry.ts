import { ILinkedInDataProvider, ProviderCapabilities, ProviderHealthStatus } from "./provider.interface";
import { CircuitBreakerOpenError } from "./errors";

interface ProviderStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  consecutiveFailures: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  averageLatencyMs: number;
  circuitBreakerOpen: boolean;
}

export class ProviderRegistry {
  private static providers: Map<string, ILinkedInDataProvider> = new Map();
  private static stats: Map<string, ProviderStats> = new Map();
  private static defaultProviderName: string = "public_guest";

  // Circuit breaker constants
  private static readonly MAX_CONSECUTIVE_FAILURES = 5;
  private static readonly CIRCUIT_RESET_MS = 60 * 1000; // 1 minute

  static register(provider: ILinkedInDataProvider): void {
    this.providers.set(provider.name, provider);
    if (!this.stats.has(provider.name)) {
      this.stats.set(provider.name, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        consecutiveFailures: 0,
        averageLatencyMs: 0,
        circuitBreakerOpen: false,
      });
    }
  }

  static get(name: string): ILinkedInDataProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`LinkedIn provider "${name}" is not registered in ProviderRegistry.`);
    }

    // Check circuit breaker
    const stat = this.stats.get(name);
    if (stat?.circuitBreakerOpen) {
      const elapsed = Date.now() - (stat.lastFailureTime?.getTime() || 0);
      if (elapsed > this.CIRCUIT_RESET_MS) {
        // Reset half-open
        stat.circuitBreakerOpen = false;
        stat.consecutiveFailures = 0;
      } else {
        throw new CircuitBreakerOpenError(name, stat.consecutiveFailures);
      }
    }

    return provider;
  }

  static getBestProviderFor(capability: keyof ProviderCapabilities): ILinkedInDataProvider {
    // Check default first
    const preferredOrder = ["playwright_browser", "public_guest", "manual_input", "imported"];
    for (const name of preferredOrder) {
      const p = this.providers.get(name);
      if (p && p.capabilities[capability]) {
        const stat = this.stats.get(name);
        if (!stat?.circuitBreakerOpen) {
          return p;
        }
      }
    }

    // Any registered provider with capability
    for (const [name, p] of this.providers.entries()) {
      if (p.capabilities[capability]) {
        const stat = this.stats.get(name);
        if (!stat?.circuitBreakerOpen) {
          return p;
        }
      }
    }

    throw new Error(`No available and healthy LinkedIn provider found for capability: ${capability}`);
  }

  static recordOutcome(providerName: string, success: boolean, latencyMs: number): void {
    const stat = this.stats.get(providerName);
    if (!stat) return;

    stat.totalRequests += 1;
    // Rolling latency update
    stat.averageLatencyMs = Math.round(
      (stat.averageLatencyMs * (stat.totalRequests - 1) + latencyMs) / stat.totalRequests
    );

    if (success) {
      stat.successfulRequests += 1;
      stat.consecutiveFailures = 0;
      stat.circuitBreakerOpen = false;
      stat.lastSuccessTime = new Date();
    } else {
      stat.failedRequests += 1;
      stat.consecutiveFailures += 1;
      stat.lastFailureTime = new Date();
      if (stat.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        stat.circuitBreakerOpen = true;
      }
    }
  }

  static getDiagnostics(): Record<string, ProviderStats & { capabilities: ProviderCapabilities }> {
    const diag: Record<string, any> = {};
    for (const [name, p] of this.providers.entries()) {
      const s = this.stats.get(name) || {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        consecutiveFailures: 0,
        averageLatencyMs: 0,
        circuitBreakerOpen: false,
      };
      diag[name] = {
        ...s,
        capabilities: p.capabilities,
      };
    }
    return diag;
  }

  static getAllProviders(): ILinkedInDataProvider[] {
    return Array.from(this.providers.values());
  }

  static resetAll(): void {
    this.providers.clear();
    this.stats.clear();
  }
}
