import { Router } from "express";
import { JoiningController } from "../../controllers/joining.controller";
import { requireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/permissions";

const router = Router();

router.use(requireAuth);

router.post(
  "/joining",
  requirePermission("joining:update"),
  JoiningController.initiate
);

router.get(
  "/joining/pipeline/:pipelineId",
  requirePermission("joining:read"),
  JoiningController.getRecord
);

router.patch(
  "/joining/pipeline/:pipelineId",
  requirePermission("joining:update"),
  JoiningController.updateProgress
);

router.post(
  "/joining/pipeline/:pipelineId/joined",
  requirePermission("joining:update"),
  JoiningController.markJoined
);

router.post(
  "/joining/pipeline/:pipelineId/no-show",
  requirePermission("joining:update"),
  JoiningController.markNoShow
);

router.post(
  "/joining/pipeline/:pipelineId/followup",
  requirePermission("joining:update"),
  JoiningController.createFollowup
);

router.get(
  "/joining/pipeline/:pipelineId/followups",
  requirePermission("joining:read"),
  JoiningController.getFollowups
);

export default router;
