import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { prisma } from "../config/database";
import { redisCache } from "../config/redis";
import { queueProvider } from "../lib/queue/queue";

const router: IRouter = Router();
const VERSION = "1.0.0";

router.get("/health", async (_req, res) => {
  let dbStatus = "disconnected";
  try {
    // Fast lightweight ping query
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (err) {
    dbStatus = "disconnected";
  }

  // Check Redis status
  const redisStatus = redisCache.isCacheEnabled() ? "connected" : "disconnected";

  // Check Queue status
  let queueStatus = "disconnected";
  try {
    const queueHealthy = await queueProvider.healthCheck();
    queueStatus = queueHealthy ? "connected" : "disconnected";
  } catch (err) {
    queueStatus = "disconnected";
  }

  const statusPayload = {
    status: (dbStatus === "connected" && redisStatus === "connected" && queueStatus === "connected") ? "ok" : "degraded",
    uptime: Math.floor(process.uptime()),
    database: dbStatus,
    redis: redisStatus,
    queue: queueStatus,
    version: VERSION,
  };

  // If DB, Redis, or Queue is down, return a degraded 503 service unavailable response
  if (dbStatus === "disconnected" || redisStatus === "disconnected" || queueStatus === "disconnected") {
    res.status(503).json(statusPayload);
    return;
  }

  res.status(200).json(statusPayload);
});

// Retain legacy healthz for backward compatibility
router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

export default router;
