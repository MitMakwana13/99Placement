import { Router } from "express";
import { OfferController } from "../../controllers/offer.controller";
import { requireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/permissions";

const router = Router();

router.use(requireAuth);

router.post(
  "/offers",
  requirePermission("offers:create"),
  OfferController.create
);

router.get(
  "/offers",
  requirePermission("offers:read"),
  OfferController.findMany
);

router.get(
  "/offers/:id",
  requirePermission("offers:read"),
  OfferController.findById
);

router.post(
  "/offers/:id/submit-approval",
  requirePermission("offers:update"),
  OfferController.submitForApproval
);

router.post(
  "/offers/:id/approval-decision",
  requirePermission("offers:approve"),
  OfferController.submitApprovalDecision
);

router.post(
  "/offers/:id/release",
  requirePermission("offers:update"),
  OfferController.release
);

router.post(
  "/offers/:id/accept",
  requirePermission("offers:update"),
  OfferController.accept
);

router.post(
  "/offers/:id/decline",
  requirePermission("offers:update"),
  OfferController.decline
);

router.post(
  "/offers/:id/revoke",
  requirePermission("offers:update"),
  OfferController.revoke
);

export default router;
