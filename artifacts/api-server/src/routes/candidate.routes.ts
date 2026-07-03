import { Router } from "express";
import { CandidateController } from "../controllers/candidate.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/permissions";

const router = Router();

// Secure all endpoints with authentication
router.use(requireAuth);

router.post(
  "/",
  requirePermission("candidates:create"),
  CandidateController.create
);

router.get(
  "/",
  requirePermission("candidates:read"),
  CandidateController.list
);

router.get(
  "/saved-filters",
  requirePermission("candidates:read"),
  CandidateController.getSavedSearchFilters
);

router.post(
  "/saved-filters",
  requirePermission("candidates:read"),
  CandidateController.saveSearchFilter
);

router.post(
  "/merge",
  requirePermission("candidates:update"),
  CandidateController.merge
);

router.get(
  "/:id",
  requirePermission("candidates:read"),
  CandidateController.getById
);

router.put(
  "/:id",
  requirePermission("candidates:update"),
  CandidateController.update
);

router.delete(
  "/:id",
  requirePermission("candidates:delete"),
  CandidateController.softDelete
);

router.post(
  "/:id/restore",
  requirePermission("candidates:delete"),
  CandidateController.restore
);

router.delete(
  "/:id/permanent",
  requirePermission("candidates:delete"),
  CandidateController.permanentDelete
);

router.post(
  "/:id/notes",
  requirePermission("candidates:update"),
  CandidateController.addNote
);

router.get(
  "/:id/notes",
  requirePermission("candidates:read"),
  CandidateController.getNotes
);

router.post(
  "/:id/documents",
  requirePermission("candidates:update"),
  CandidateController.uploadDocument
);

router.get(
  "/:id/timeline",
  requirePermission("candidates:read"),
  CandidateController.getTimeline
);

export default router;
