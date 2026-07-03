import { Router, type IRouter } from "express";
import { LoginInputSchema, RegisterTenantInputSchema } from "@workspace/shared-schemas";
import { AuthService } from "../../services/auth.service";
import { requireAuth } from "../../middleware/auth";

const router: IRouter = Router();

/**
 * @route POST /api/auth/register-tenant
 * @desc Register a new SaaS Tenant (consultancy) and administrator admin user
 * @access Public
 */
router.post("/auth/register-tenant", async (req, res): Promise<void> => {
  try {
    const validation = RegisterTenantInputSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const onboardingResult = await AuthService.registerTenant(validation.data);
    res.status(201).json({
      success: true,
      data: onboardingResult,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Onboarding failed" });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login user and retrieve bearer token
 * @access Public
 */
router.post("/auth/login", async (req, res): Promise<void> => {
  try {
    const validation = LoginInputSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const loginResult = await AuthService.login(validation.data);
    res.json({
      success: true,
      data: loginResult,
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message || "Invalid credentials" });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Retrieve current authenticated session
 * @access Private
 */
router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const sessionUser = await AuthService.verifySession(req.user.userId);
    res.json({
      success: true,
      data: sessionUser,
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message || "Session expired or invalid" });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout session (Stateless client side flush)
 * @access Private
 */
router.post("/auth/logout", requireAuth, async (_req, res): Promise<void> => {
  res.sendStatus(204);
});

export default router;
