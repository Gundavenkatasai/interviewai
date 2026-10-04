import { EventEmitter } from "events";
import { randomUUID } from "crypto";

export type JobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "RETRYING" | "CANCELLED";

export interface IQueueJob<T = any, R = any> {
  id: string;
  userId: string;
  type: "PARSE" | "ATS_SCAN" | "ARTIFACT_GEN" | "AI_IMPROVE" | "EXPORT";
  payload: T;
  idempotencyKey?: string;
  status: JobStatus;
  priority: number; // Higher number = higher priority
  attempts: number;
  maxAttempts: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: R;
  timeoutMs: number;
}

export class ResumeWorkerQueue extends EventEmitter {
  private static instance: ResumeWorkerQueue;
  private queue: IQueueJob[] = [];
  private activeCount: number = 0;
  private maxConcurrency: number = 5; // Bounded worker pool for CPU/Memory safety
  private jobHistory: Map<string, IQueueJob> = new Map();
  private idempotencyMap: Map<string, Promise<any>> = new Map();

  private constructor() {
    super();
  }

  public static getInstance(): ResumeWorkerQueue {
    if (!ResumeWorkerQueue.instance) {
      ResumeWorkerQueue.instance = new ResumeWorkerQueue();
    }
    return ResumeWorkerQueue.instance;
  }

  /**
   * Enqueue a job with bounded concurrency, priority, timeout, and idempotency
   */
  public async add<T = any, R = any>(
    type: IQueueJob["type"],
    userId: string,
    payload: T,
    handler: (payload: T) => Promise<R>,
    options: {
      priority?: number;
      maxAttempts?: number;
      timeoutMs?: number;
      idempotencyKey?: string;
    } = {}
  ): Promise<R> {
    const {
      priority = 10,
      maxAttempts = 2,
      timeoutMs = 30000,
      idempotencyKey
    } = options;

    // Idempotency check: if a matching task is already running or recently completed, reuse it
    if (idempotencyKey && this.idempotencyMap.has(idempotencyKey)) {
      return this.idempotencyMap.get(idempotencyKey) as Promise<R>;
    }

    const jobId = randomUUID();
    const job: IQueueJob<T, R> = {
      id: jobId,
      userId,
      type,
      payload,
      idempotencyKey,
      status: "QUEUED",
      priority,
      attempts: 0,
      maxAttempts,
      timeoutMs
    };

    this.jobHistory.set(jobId, job);
    // Keep max 1000 history entries to avoid memory leak
    if (this.jobHistory.size > 1000) {
      const oldestKey = this.jobHistory.keys().next().value;
      if (oldestKey) this.jobHistory.delete(oldestKey);
    }

    const executionPromise = new Promise<R>((resolve, reject) => {
      const execute = async () => {
        job.attempts += 1;
        job.status = "PROCESSING";
        job.startedAt = new Date();
        this.activeCount++;

        let timer: NodeJS.Timeout | null = null;
        const timeoutPromise = new Promise<never>((_, timeoutReject) => {
          timer = setTimeout(() => {
            timeoutReject(new Error(`Job ${type} timed out after ${timeoutMs}ms`));
          }, timeoutMs);
        });

        try {
          const result = await Promise.race([handler(job.payload), timeoutPromise]);
          if (timer) clearTimeout(timer);

          job.status = "COMPLETED";
          job.completedAt = new Date();
          job.result = result;
          this.emit("job:completed", job);
          resolve(result);
        } catch (err: any) {
          if (timer) clearTimeout(timer);

          if (job.attempts < job.maxAttempts) {
            job.status = "RETRYING";
            this.emit("job:retry", job, err);
            // Re-queue with exponential backoff delay
            setTimeout(() => {
              this.activeCount--;
              this.queue.unshift(job); // High priority on retry
              this.processNext();
            }, Math.min(1000 * Math.pow(2, job.attempts), 5000));
            return;
          }

          job.status = "FAILED";
          job.completedAt = new Date();
          job.error = err.message || "Unknown error";
          this.emit("job:failed", job, err);
          reject(err);
        } finally {
          if (job.status !== "RETRYING") {
            this.activeCount--;
            this.processNext();
          }
        }
      };

      // Wrap job with executor
      (job as any).executor = execute;

      // Insert in priority order
      const insertIndex = this.queue.findIndex(j => j.priority < priority);
      if (insertIndex === -1) {
        this.queue.push(job);
      } else {
        this.queue.splice(insertIndex, 0, job);
      }

      this.processNext();
    });

    if (idempotencyKey) {
      this.idempotencyMap.set(idempotencyKey, executionPromise);
      // Clean up after 60 seconds
      setTimeout(() => {
        this.idempotencyMap.delete(idempotencyKey);
      }, 60000);
    }

    return executionPromise;
  }

  private processNext() {
    if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const nextJob = this.queue.shift();
    if (nextJob && (nextJob as any).executor) {
      (nextJob as any).executor();
    }
  }

  public getJob(id: string): IQueueJob | undefined {
    return this.jobHistory.get(id);
  }

  public getActiveCount(): number {
    return this.activeCount;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }
}
