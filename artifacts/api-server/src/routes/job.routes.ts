import { Router } from "express";
import { JobController } from "../controllers/job.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/permissions";

const router = Router();

// All endpoints require authentication
router.use(requireAuth);

// ── Metrics & Filters ────────────────────────────────────────────────────────

router.get(
  "/metrics",
  requirePermission("jobs:read"),
  JobController.getMetrics,
);

router.get(
  "/saved-filters",
  requirePermission("jobs:read"),
  JobController.getFilters,
);

router.post(
  "/saved-filters",
  requirePermission("jobs:read"),
  JobController.saveFilter,
);

// ── Core CRUD ────────────────────────────────────────────────────────────────

router.post(
  "/",
  requirePermission("jobs:create"),
  JobController.create,
);

router.get(
  "/",
  requirePermission("jobs:read"),
  JobController.list,
);

router.get(
  "/:id",
  requirePermission("jobs:read"),
  JobController.getById,
);

router.put(
  "/:id",
  requirePermission("jobs:update"),
  JobController.update,
);

// ── Lifecycle ─────────────────────────────────────────────────────────────────

router.post(
  "/:id/submit",
  requirePermission("jobs:update"),
  JobController.submitForApproval,
);

router.post(
  "/:id/approve",
  requirePermission("jobs:approve"),
  JobController.approve,
);

router.post(
  "/:id/close",
  requirePermission("jobs:update"),
  JobController.close,
);

router.post(
  "/:id/reopen",
  requirePermission("jobs:update"),
  JobController.reopen,
);

router.post(
  "/:id/archive",
  requirePermission("jobs:delete"),
  JobController.archive,
);

router.post(
  "/:id/restore",
  requirePermission("jobs:delete"),
  JobController.restore,
);

router.delete(
  "/:id/permanent",
  requirePermission("jobs:delete"),
  JobController.permanentDelete,
);

router.post(
  "/:id/clone",
  requirePermission("jobs:create"),
  JobController.clone,
);

// ── Recruiter Assignment ─────────────────────────────────────────────────────

router.post(
  "/:id/recruiters",
  requirePermission("jobs:update"),
  JobController.assignRecruiter,
);

router.delete(
  "/:id/recruiters/:userId",
  requirePermission("jobs:update"),
  JobController.removeRecruiter,
);

// ── Hiring Manager Assignment ────────────────────────────────────────────────

router.post(
  "/:id/hiring-managers",
  requirePermission("jobs:update"),
  JobController.assignHiringManager,
);

router.delete(
  "/:id/hiring-managers/:userId",
  requirePermission("jobs:update"),
  JobController.removeHiringManager,
);

// ── Documents ─────────────────────────────────────────────────────────────────

router.post(
  "/:id/documents",
  requirePermission("jobs:update"),
  JobController.addDocument,
);

router.get(
  "/:id/documents",
  requirePermission("jobs:read"),
  JobController.getDocuments,
);

// ── Timeline ──────────────────────────────────────────────────────────────────

router.get(
  "/:id/timeline",
  requirePermission("jobs:read"),
  JobController.getTimeline,
);

// ── Status History ────────────────────────────────────────────────────────────

router.get(
  "/:id/status-history",
  requirePermission("jobs:read"),
  JobController.getStatusHistory,
);

export default router;
