import { Router } from "express";
import { InterviewController } from "../controllers/interview.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/permissions";

const router = Router();

router.use(requireAuth);

router.post(
  "/",
  requirePermission("interviews:create"),
  InterviewController.schedule
);

router.get(
  "/",
  requirePermission("interviews:read"),
  InterviewController.findMany
);

router.get(
  "/:id",
  requirePermission("interviews:read"),
  InterviewController.findById
);

router.patch(
  "/:id/reschedule",
  requirePermission("interviews:update"),
  InterviewController.reschedule
);

router.patch(
  "/:id/cancel",
  requirePermission("interviews:update"),
  InterviewController.cancel
);

router.post(
  "/:id/complete",
  requirePermission("interviews:update"),
  InterviewController.complete
);

router.post(
  "/:id/no-show",
  requirePermission("interviews:update"),
  InterviewController.noShow
);

router.post(
  "/:id/feedback",
  requirePermission("interviews:write_feedback"),
  InterviewController.submitFeedback
);

export default router;
