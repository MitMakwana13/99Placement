import { Router } from "express";
import { ScreeningController } from "../controllers/screening.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/permissions";

const router = Router();

// All endpoints require authentication
router.use(requireAuth);

// ── Metrics Dashboard ─────────────────────────────────────────────────────────

router.get(
  "/metrics",
  requirePermission("screenings:read"),
  ScreeningController.getMetrics,
);

// ── By Pipeline ───────────────────────────────────────────────────────────────

router.get(
  "/pipeline/:pipelineId",
  requirePermission("screenings:read"),
  ScreeningController.findByPipeline,
);

// ── Core CRUD ────────────────────────────────────────────────────────────────

router.post(
  "/",
  requirePermission("screenings:create"),
  ScreeningController.schedule,
);

router.get(
  "/",
  requirePermission("screenings:read"),
  ScreeningController.findMany,
);

router.get(
  "/:id",
  requirePermission("screenings:read"),
  ScreeningController.findById,
);

// ── Workflow Actions ──────────────────────────────────────────────────────────

router.patch(
  "/:id/reschedule",
  requirePermission("screenings:update"),
  ScreeningController.reschedule,
);

router.post(
  "/:id/scorecard",
  requirePermission("screenings:conduct"),
  ScreeningController.submitScorecard,
);

router.patch(
  "/:id/cancel",
  requirePermission("screenings:update"),
  ScreeningController.cancel,
);

router.patch(
  "/:id/restore",
  requirePermission("screenings:update"),
  ScreeningController.restore,
);

export default router;
