import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import * as commController from "../controllers/communication.controller";

const router = Router();

// Only HR/RECRUITER/TENANT_ADMIN should send communications
router.post("/email", requireAuth, requireRole("HR", "RECRUITER", "TENANT_ADMIN"), commController.sendCustomEmail);
router.post("/whatsapp", requireAuth, requireRole("HR", "RECRUITER", "TENANT_ADMIN"), commController.sendWhatsApp);
router.post("/sms", requireAuth, requireRole("HR", "RECRUITER", "TENANT_ADMIN"), commController.sendSms);

export default router;
