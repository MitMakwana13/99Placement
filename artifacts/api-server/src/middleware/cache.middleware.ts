import { Request, Response, NextFunction } from "express";
import { redisCache } from "../config/redis";
import { logger } from "../config/logger";

/**
 * Cache middleware to store successful JSON responses in Redis
 * Keys are namespaced by the prefix, the tenantId, and the original request URL.
 */
export function cacheMiddleware(prefix: string, ttlSeconds: number = 300) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== "GET" || !redisCache.isCacheEnabled()) {
      return next();
    }

    const tenantId = req.user?.tenantId || "global";
    const cacheKey = `cache:${prefix}:${tenantId}:${req.originalUrl || req.url}`;

    try {
      const cached = await redisCache.get(cacheKey);
      if (cached) {
        logger.debug({ cacheKey }, "Cache hit - returning cached body");
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Content-Type", "application/json");
        res.status(200).send(cached);
        return;
      }

      logger.debug({ cacheKey }, "Cache miss - passing to route handler");
      res.setHeader("X-Cache", "MISS");

      // Intercept the res.send / res.json method to capture response payload
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisCache.set(cacheKey, JSON.stringify(body), ttlSeconds).catch((err) => {
            logger.error({ error: err.message, cacheKey }, "Failed to write payload to Redis cache");
          });
        }
        return originalJson(body);
      };

      next();
    } catch (err: any) {
      logger.error({ error: err.message, cacheKey }, "Error reading from Redis cache - falling back");
      next();
    }
  };
}

/**
 * Evict all keys belonging to a specific prefix & tenant ID
 */
export async function invalidateCache(prefix: string, tenantId: string): Promise<void> {
  if (!redisCache.isCacheEnabled()) return;

  try {
    const redis = redisCache.getClient();
    if (!redis) return;

    const pattern = `cache:${prefix}:${tenantId}:*`;
    let cursor = "0";
    let keysDeleted = 0;

    do {
      const result = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = result[0];
      const keys = result[1];

      if (keys.length > 0) {
        await redis.del(...keys);
        keysDeleted += keys.length;
      }
    } while (cursor !== "0");

    if (keysDeleted > 0) {
      logger.info({ prefix, tenantId, keysDeleted }, "Cache matching pattern invalidated successfully");
    }
  } catch (err: any) {
    logger.error({ error: err.message, prefix, tenantId }, "Failed to invalidate cache");
  }
}
