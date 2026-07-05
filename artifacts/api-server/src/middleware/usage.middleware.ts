/**
 * Usage Limit Middleware — enforces subscription plan limits before write operations.
 *
 * Usage:
 *   router.post("/", checkCountLimit("candidates"), handler)
 *   router.post("/ai/parse", checkMonthlyLimit("resume_parses"), handler)
 */

import { Request, Response, NextFunction } from "express";
import { SubscriptionService, CountableResource, UsageMetric } from "../services/subscription.service";
import { AppError } from "../utils/app-error";
import logger from "../lib/logger";

/**
 * Middleware that checks if a tenant can create more of a given resource type.
 * Use on POST routes that create new DB records.
 */
export function checkCountLimit(resource: CountableResource) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) return next(); // No tenant context (shouldn't happen in authenticated routes)

      await SubscriptionService.checkCountLimit(tenantId, resource);
      next();
    } catch (err) {
      if (err instanceof AppError && err.statusCode === 402) {
        logger.warn(`Usage limit exceeded: ${resource} for tenant ${req.context?.tenantId}`);
        return res.status(402).json({
          success: false,
          error: err.message,
          code: err.code,
          details: err.details,
        });
      }
      next(err);
    }
  };
}

/**
 * Middleware that checks if a tenant's monthly usage metric has hit its plan limit.
 * Use on routes that consume monthly quotas (AI calls, emails, etc.).
 */
export function checkMonthlyLimit(metric: UsageMetric) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) return next();

      await SubscriptionService.checkUsageLimit(tenantId, metric);
      next();
    } catch (err) {
      if (err instanceof AppError && err.statusCode === 402) {
        logger.warn(`Monthly limit exceeded: ${metric} for tenant ${req.context?.tenantId}`);
        return res.status(402).json({
          success: false,
          error: err.message,
          code: err.code,
          details: err.details,
        });
      }
      next(err);
    }
  };
}

/**
 * Helper to increment usage after a successful action.
 * Call this AFTER the main action succeeds (fire-and-forget, non-blocking).
 */
export function trackUsage(tenantId: string, metric: UsageMetric, amount: number = 1): void {
  SubscriptionService.incrementUsage(tenantId, metric, amount).catch((err) => {
    logger.error(`Failed to track usage metric ${metric} for tenant ${tenantId}: ${err.message}`);
  });
}
