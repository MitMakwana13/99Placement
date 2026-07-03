import { Queue as BullQueue, Worker as BullWorker, ConnectionOptions } from "bullmq";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

export interface JobOptions {
  delay?: number;
  attempts?: number;
  backoff?: number;
}

export interface IQueueProvider {
  addJob<T = any>(queueName: string, jobName: string, data: T, opts?: JobOptions): Promise<void>;
  registerProcessor<T = any>(
    queueName: string,
    processor: (data: T) => Promise<void>,
    concurrency?: number
  ): void;
  close(): Promise<void>;
  healthCheck(): Promise<boolean>;
}

/**
 * 1. In-Memory Queue Provider
 * Executes jobs asynchronously in memory (or synchronously in tests).
 */
export class InMemoryQueueProvider implements IQueueProvider {
  private processors = new Map<string, (data: any) => Promise<void>>();

  async addJob<T = any>(queueName: string, jobName: string, data: T, opts?: JobOptions): Promise<void> {
    const processor = this.processors.get(queueName);
    if (!processor) {
      logger.warn(`No processor registered for queue: ${queueName}. Job [${jobName}] will be deferred.`);
      return;
    }

    if (process.env.NODE_ENV === "test") {
      // In tests, execute synchronously to maintain deterministic expectations
      try {
        await processor(data);
      } catch (err: any) {
        logger.error(`InMemoryQueue: job [${jobName}] failed: ${err.message}`);
      }
    } else {
      // In production/dev in-memory mode, run asynchronously via timeout/immediate
      const delayMs = opts?.delay || 0;
      setTimeout(async () => {
        try {
          await processor(data);
        } catch (err: any) {
          logger.error(`InMemoryQueue: job [${jobName}] failed: ${err.message}`);
        }
      }, delayMs);
    }
  }

  registerProcessor<T = any>(
    queueName: string,
    processor: (data: T) => Promise<void>,
    _concurrency?: number
  ): void {
    this.processors.set(queueName, processor);
    logger.info(`InMemoryQueue: processor registered for queue: ${queueName}`);
  }

  async close(): Promise<void> {
    this.processors.clear();
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

/**
 * 2. BullMQ (Redis-backed) Queue Provider
 */
export class BullQueueProvider implements IQueueProvider {
  private queues = new Map<string, BullQueue>();
  private workers = new Map<string, BullWorker>();
  private connection: ConnectionOptions;

  constructor() {
    // Default to port 6380 (Queue Redis instance) on localhost if environment url is absent
    const url = env.REDIS_QUEUE_URL || env.REDIS_URL || "redis://localhost:6380";
    
    // Parse Redis connection details
    try {
      const parsed = new URL(url);
      this.connection = {
        host: parsed.hostname || "localhost",
        port: parsed.port ? parseInt(parsed.port, 10) : 6380,
        password: parsed.password || undefined,
        username: parsed.username || undefined,
        maxRetriesPerRequest: null, // Critical requirement for BullMQ
      };
    } catch {
      this.connection = {
        host: "localhost",
        port: 6380,
        maxRetriesPerRequest: null,
      };
    }
  }

  private getOrCreateQueue(queueName: string): BullQueue {
    let queue = this.queues.get(queueName);
    if (!queue) {
      queue = new BullQueue(queueName, { connection: this.connection });
      this.queues.set(queueName, queue);
      logger.info(`BullQueue: queue connection initialized for [${queueName}]`);
    }
    return queue;
  }

  async addJob<T = any>(queueName: string, jobName: string, data: T, opts?: JobOptions): Promise<void> {
    try {
      const queue = this.getOrCreateQueue(queueName);
      await queue.add(jobName, data, {
        delay: opts?.delay,
        attempts: opts?.attempts || 3,
        backoff: opts?.backoff ? { type: "exponential", delay: opts.backoff } : undefined,
        removeOnComplete: true,
        removeOnFail: 100, // keep last 100 failures for audit
      });
      logger.debug(`BullQueue: added job [${jobName}] to queue [${queueName}]`);
    } catch (err: any) {
      logger.error(`BullQueue: failed to add job to queue [${queueName}]: ${err.message}`);
      throw err;
    }
  }

  registerProcessor<T = any>(
    queueName: string,
    processor: (data: T) => Promise<void>,
    concurrency = 1
  ): void {
    if (this.workers.has(queueName)) {
      logger.warn(`BullQueue: processor already registered for queue [${queueName}]`);
      return;
    }

    const worker = new BullWorker(
      queueName,
      async (job) => {
        logger.debug(`BullQueue: processing job [${job.name}] on queue [${queueName}]`);
        await processor(job.data);
      },
      {
        connection: this.connection,
        concurrency,
      }
    );

    worker.on("completed", (job) => {
      logger.debug(`BullQueue: job [${job.id}] completed successfully`);
    });

    worker.on("failed", (job, err) => {
      logger.error(`BullQueue: job [${job?.id}] failed: ${err.message}`);
    });

    this.workers.set(queueName, worker);
    logger.info(`BullQueue: worker listening on queue [${queueName}] with concurrency ${concurrency}`);
  }

  async close(): Promise<void> {
    for (const worker of this.workers.values()) {
      await worker.close();
    }
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    this.workers.clear();
    this.queues.clear();
    logger.info("BullQueue: all queues and workers closed");
  }

  async healthCheck(): Promise<boolean> {
    try {
      const Redis = (await import("ioredis")).default;
      const conn = this.connection as any;
      const client = new Redis({
        host: conn.host,
        port: conn.port,
        password: conn.password,
        username: conn.username,
        maxRetriesPerRequest: 1, // fast failure for healthcheck
      });
      const res = await client.ping();
      await client.quit();
      return res === "PONG";
    } catch {
      return false;
    }
  }
}

// Global active queue provider factory
export const queueProvider: IQueueProvider =
  process.env.NODE_ENV === "test" || !env.REDIS_URL
    ? new InMemoryQueueProvider()
    : new BullQueueProvider();
