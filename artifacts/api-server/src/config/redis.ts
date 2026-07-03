import Redis from "ioredis";
import { env } from "./env";
import { logger } from "./logger";

class RedisCacheManager {
  private client: Redis | null = null;
  private isReady = false;

  constructor() {
    const redisUrl = env.REDIS_URL || "redis://localhost:6379";
    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
        retryStrategy(times) {
          if (times > 3) {
            logger.warn(`Redis connection failed after ${times} attempts. Disabling cache fallback.`);
            return null; // Stop retrying and fail connection
          }
          return Math.min(times * 100, 2000);
        },
      });

      this.client.on("connect", () => {
        logger.info(`Redis connected successfully to: ${redisUrl.split("@").pop()}`);
      });

      this.client.on("ready", () => {
        this.isReady = true;
        logger.info("Redis cache client ready");
      });

      this.client.on("error", (err) => {
        this.isReady = false;
        logger.warn(`Redis cache connection error: ${err.message}`);
      });

      this.client.on("end", () => {
        this.isReady = false;
        logger.warn("Redis cache connection ended");
      });
    } catch (error: any) {
      logger.warn(`Failed to initialize Redis cache client: ${error.message}`);
      this.client = null;
      this.isReady = false;
    }
  }

  public getClient(): Redis | null {
    return this.client;
  }

  public isCacheEnabled(): boolean {
    return this.isReady && this.client !== null;
  }

  /**
   * Safe GET wrapper
   */
  public async get(key: string): Promise<string | null> {
    if (!this.isCacheEnabled() || !this.client) {
      return null;
    }
    try {
      return await this.client.get(key);
    } catch (err: any) {
      logger.warn(`Redis GET failed for key [${key}]: ${err.message}`);
      return null;
    }
  }

  /**
   * Safe SET wrapper with optional TTL (seconds)
   */
  public async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.isCacheEnabled() || !this.client) {
      return false;
    }
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, "EX", ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (err: any) {
      logger.warn(`Redis SET failed for key [${key}]: ${err.message}`);
      return false;
    }
  }

  /**
   * Safe DELETE wrapper
   */
  public async del(key: string): Promise<boolean> {
    if (!this.isCacheEnabled() || !this.client) {
      return false;
    }
    try {
      await this.client.del(key);
      return true;
    } catch (err: any) {
      logger.warn(`Redis DEL failed for key [${key}]: ${err.message}`);
      return false;
    }
  }

  /**
   * Safe pattern scan / delete
   */
  public async delPattern(pattern: string): Promise<boolean> {
    if (!this.isCacheEnabled() || !this.client) {
      return false;
    }
    try {
      const stream = this.client.scanStream({ match: pattern });
      let pipeline = this.client.pipeline();
      let count = 0;

      for await (const keys of stream) {
        if (keys && keys.length > 0) {
          keys.forEach((key: string) => {
            pipeline.del(key);
            count++;
          });
        }
        if (count >= 100) {
          await pipeline.exec();
          pipeline = this.client.pipeline();
          count = 0;
        }
      }
      if (count > 0) {
        await pipeline.exec();
      }
      return true;
    } catch (err: any) {
      logger.warn(`Redis DEL pattern [${pattern}] failed: ${err.message}`);
      return false;
    }
  }
}

export const redisCache = new RedisCacheManager();
