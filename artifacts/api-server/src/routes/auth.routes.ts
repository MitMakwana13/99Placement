import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { LoginInputSchema, RegisterTenantInputSchema } from "@workspace/shared-schemas";
import {
  ForgotPasswordInputSchema,
  ResetPasswordInputSchema,
  UpdateProfileInputSchema,
  ChangePasswordInputSchema,
  VerifyEmailInputSchema,
} from "../validators/auth.validator";

const router = Router();

// Public routes
router.post(
  "/register-tenant",
  validate({ body: RegisterTenantInputSchema }),
  AuthController.registerTenant
);

router.post(
  "/login",
  validate({ body: LoginInputSchema }),
  AuthController.login
);

router.post(
  "/refresh",
  AuthController.refresh
);

router.post(
  "/logout",
  AuthController.logout
);

router.post(
  "/forgot-password",
  validate({ body: ForgotPasswordInputSchema }),
  AuthController.forgotPassword
);

router.post(
  "/reset-password",
  validate({ body: ResetPasswordInputSchema }),
  AuthController.resetPassword
);

router.post(
  "/verify-email",
  validate({ body: VerifyEmailInputSchema }),
  AuthController.verifyEmail
);

// Authenticated private routes
router.get(
  "/me",
  requireAuth,
  AuthController.me
);

router.put(
  "/profile",
  requireAuth,
  validate({ body: UpdateProfileInputSchema }),
  AuthController.updateProfile
);

router.put(
  "/change-password",
  requireAuth,
  validate({ body: ChangePasswordInputSchema }),
  AuthController.changePassword
);

router.post(
  "/logout-all",
  requireAuth,
  AuthController.logoutAllDevices
);

export default router;
