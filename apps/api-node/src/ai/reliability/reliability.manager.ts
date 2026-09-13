import { AIProvider, GenerateTextRequest, GenerateStructuredRequest, AIError } from "../core/provider.interface";

class Semaphore {
  private tasks: (() => void)[] = [];
  private active = 0;

  constructor(private maxConcurrent: number) {}

  async acquire(): Promise<void> {
    if (this.active < this.maxConcurrent) {
      this.active++;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.tasks.push(resolve);
    });
  }

  release(): void {
    if (this.tasks.length > 0) {
      const next = this.tasks.shift();
      if (next) next();
    } else {
      this.active--;
    }
  }
}

export class ReliabilityManager {
  // Global bounded concurrency across all AI requests
  private static globalSemaphore = new Semaphore(parseInt(process.env.AI_MAX_CONCURRENT_REQUESTS || "10", 10));

  private static async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async executeText(
    provider: AIProvider,
    request: GenerateTextRequest,
    maxRetries = 2
  ): Promise<string> {
    return this.executeWithRetry(() => provider.generateText(request), maxRetries);
  }

  static async executeStructured<T>(
    provider: AIProvider,
    request: GenerateStructuredRequest<T>,
    maxRetries = 2
  ): Promise<T> {
    return this.executeWithRetry(() => provider.generateStructured<T>(request), maxRetries);
  }

  private static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let attempts = 0;
    const baseDelay = parseInt(process.env.AI_BACKOFF_BASE_MS || "1000", 10);

    while (true) {
      attempts++;
      await this.globalSemaphore.acquire();
      try {
        // Enforce a hard timeout by racing
        const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS || "30000", 10);
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new AIError("TIMEOUT", "unknown", true, `Request timed out after ${timeoutMs}ms`)), timeoutMs);
        });

        const result = await Promise.race([operation(), timeoutPromise]);
        this.globalSemaphore.release();
        return result;
      } catch (err: any) {
        this.globalSemaphore.release();
        
        // If it's a known AIError, check if it's retryable
        if (err instanceof AIError && !err.retryable) {
          throw err;
        }

        if (attempts >= maxRetries + 1) {
          throw new AIError("SERVER_ERROR", "unknown", false, `Max retries (${maxRetries}) exceeded`, err);
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempts - 1) + Math.random() * 500;
        console.warn(`[ReliabilityManager] AI Request failed (Attempt ${attempts}/${maxRetries + 1}). Retrying in ${Math.round(delay)}ms... Error: ${err.message}`);
        await this.sleep(delay);
      }
    }
  }
}
