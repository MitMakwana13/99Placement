import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { prisma } from "../config/database";

const router: IRouter = Router();

// Version constant (production/package configuration representation)
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

  const statusPayload = {
    status: "ok",
    uptime: Math.floor(process.uptime()),
    database: dbStatus,
    version: VERSION,
  };

  // If DB connection is down, return a degraded 503 service unavailable response
  if (dbStatus === "disconnected") {
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
