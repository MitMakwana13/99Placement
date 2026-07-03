import { Router } from "express";
import { AssessmentController } from "../controllers/assessment.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/permissions";

const router = Router();

// All endpoints require authentication
router.use(requireAuth);

// ── Metrics & Dashboard ──────────────────────────────────────────────────────
router.get(
  "/metrics",
  requirePermission("assessments:read"),
  AssessmentController.getMetrics,
);

// ── Assessment Templates CRUD ───────────────────────────────────────────────
router.post(
  "/templates",
  requirePermission("assessments:create"),
  AssessmentController.createTemplate,
);

router.get(
  "/templates",
  requirePermission("assessments:read"),
  AssessmentController.listTemplates,
);

router.get(
  "/templates/:id",
  requirePermission("assessments:read"),
  AssessmentController.getTemplateById,
);

router.patch(
  "/templates/:id",
  requirePermission("assessments:update"),
  AssessmentController.updateTemplate,
);

router.delete(
  "/templates/:id",
  requirePermission("assessments:delete"),
  AssessmentController.deleteTemplate,
);

// ── Question Bank ─────────────────────────────────────────────────────────────
router.get(
  "/questions/weak",
  requirePermission("assessments:read"),
  AssessmentController.getWeakQuestions,
);

router.post(
  "/questions",
  requirePermission("assessments:create"),
  AssessmentController.createQuestion,
);

router.get(
  "/questions",
  requirePermission("assessments:read"),
  AssessmentController.listQuestions,
);

router.get(
  "/questions/:id",
  requirePermission("assessments:read"),
  AssessmentController.getQuestionById,
);

router.patch(
  "/questions/:id",
  requirePermission("assessments:update"),
  AssessmentController.updateQuestion,
);

router.delete(
  "/questions/:id",
  requirePermission("assessments:delete"),
  AssessmentController.deleteQuestion,
);

// ── Test Assignment ──────────────────────────────────────────────────────────
router.post(
  "/assign",
  requirePermission("assessments:create"),
  AssessmentController.assignTest,
);

router.get(
  "/tests",
  requirePermission("assessments:read"),
  AssessmentController.listTests,
);

router.get(
  "/tests/:id",
  requirePermission("assessments:read"),
  AssessmentController.getTestById,
);

router.get(
  "/tests/:id/candidate",
  requirePermission("assessments:read"),
  AssessmentController.getTestForCandidate,
);

router.get(
  "/tests/:id/report",
  requirePermission("assessments:read"),
  AssessmentController.getDetailedReportCard,
);

// ── Timed Test Flow Actions ──────────────────────────────────────────────────
router.post(
  "/tests/:id/start",
  requirePermission("assessments:read"),
  AssessmentController.startTest,
);

router.post(
  "/tests/:id/answers",
  requirePermission("assessments:read"),
  AssessmentController.submitAnswer,
);

router.post(
  "/tests/:id/submit",
  requirePermission("assessments:read"),
  AssessmentController.completeTest,
);

export default router;
