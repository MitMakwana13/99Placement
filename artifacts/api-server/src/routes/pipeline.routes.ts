import { Router } from "express";
import { PipelineController } from "../controllers/pipeline.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/permissions";

const router = Router();

// All endpoints require authentication
router.use(requireAuth);

// ── Metrics & Performance Dashboard ──────────────────────────────────────────

router.get(
  "/metrics",
  requirePermission("candidates:read"),
  PipelineController.getMetrics,
);

// ── Core CRUD ────────────────────────────────────────────────────────────────

router.post(
  "/",
  requirePermission("candidates:update"),
  PipelineController.create,
);

router.get(
  "/",
  requirePermission("candidates:read"),
  PipelineController.list,
);

router.get(
  "/:id",
  requirePermission("candidates:read"),
  PipelineController.getById,
);

router.delete(
  "/:id",
  requirePermission("candidates:delete"),
  PipelineController.softDelete,
);

router.post(
  "/:id/restore",
  requirePermission("candidates:delete"),
  PipelineController.restore,
);

router.delete(
  "/:id/permanent",
  requirePermission("candidates:delete"),
  PipelineController.permanentDelete,
);

// ── Stage & Workflow Transitions ────────────────────────────────────────────

router.patch(
  "/bulk-stage",
  requirePermission("candidates:update"),
  PipelineController.bulkUpdateStage,
);

router.patch(
  "/:id/stage",
  requirePermission("candidates:update"),
  PipelineController.updateStage,
);

// ── Sub-resources: Notes ─────────────────────────────────────────────────────

router.post(
  "/:id/notes",
  requirePermission("candidates:update"),
  PipelineController.createNote,
);

router.delete(
  "/:id/notes/:noteId",
  requirePermission("candidates:update"),
  PipelineController.deleteNote,
);

// ── Sub-resources: Attachments ───────────────────────────────────────────────

router.post(
  "/:id/attachments",
  requirePermission("candidates:update"),
  PipelineController.createAttachment,
);

router.delete(
  "/:id/attachments/:attachmentId",
  requirePermission("candidates:update"),
  PipelineController.deleteAttachment,
);

// ── Sub-resources: Ratings ───────────────────────────────────────────────────

router.patch(
  "/:id/ratings",
  requirePermission("candidates:update"),
  PipelineController.updateRating,
);

// ── Sub-resources: Checklist Items ───────────────────────────────────────────

router.patch(
  "/:id/checklist/:itemKey",
  requirePermission("candidates:update"),
  PipelineController.updateChecklistItem,
);

// ── Sub-resources: Reminders ──────────────────────────────────────────────────

router.post(
  "/:id/reminders",
  requirePermission("candidates:update"),
  PipelineController.createReminder,
);

router.patch(
  "/:id/reminders/:reminderId",
  requirePermission("candidates:update"),
  PipelineController.updateReminderCompletion,
);

export default router;
