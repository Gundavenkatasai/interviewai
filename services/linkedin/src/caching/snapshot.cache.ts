interface CacheEntry<T> {
  data: T;
  version: string;
  expiresAt: number;
  createdAt: number;
}

export class SnapshotCache {
  private static store: Map<string, CacheEntry<any>> = new Map();
  private static inFlightRequests: Map<string, Promise<any>> = new Map();
  private static readonly DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

  /**
   * Deduplicates concurrent in-flight requests for the same key
   */
  static async deduplicateInFlight<T>(key: string, loader: () => Promise<T>): Promise<T> {
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key) as Promise<T>;
    }

    const promise = loader()
      .finally(() => {
        this.inFlightRequests.delete(key);
      });

    this.inFlightRequests.set(key, promise);
    return promise;
  }

  /**
   * Retrieves an item from cache if version matches and TTL has not expired
   */
  static get<T>(key: string, expectedVersion?: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    if (expectedVersion && entry.version !== expectedVersion) {
      return null;
    }

    return entry.data as T;
  }

  /**
   * Stores an item in cache
   */
  static set<T>(key: string, data: T, version: string = "v1", ttlMs: number = this.DEFAULT_TTL_MS): void {
    // Bound cache memory (max 1,000 entries)
    if (this.store.size > 1000) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }

    this.store.set(key, {
      data,
      version,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
    });
  }

  /**
   * Invalidates entries matching a prefix or key
   */
  static invalidate(pattern: string): void {
    for (const key of this.store.keys()) {
      if (key.includes(pattern)) {
        this.store.delete(key);
      }
    }
  }

  static clear(): void {
    this.store.clear();
    this.inFlightRequests.clear();
  }
}
