import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { sendSuccess, sendCreated } from "../utils/response";
import { env } from "../config/env";

const isProduction = env.NODE_ENV === "production";

/**
 * Utility to assign refresh token to HttpOnly SameSite cookie
 */
function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api/v1/auth/refresh", // Limit path scope
  });
}

/**
 * Utility to clear the refresh token cookie
 */
function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/api/v1/auth/refresh",
  });
}

export class AuthController {
  /**
   * Registers a new tenant and dynamic admin user
   */
  static async registerTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AuthService.registerTenant(req.body);
      sendCreated(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Logins a user and sets the refresh token cookie
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress = req.ip || null;
      const userAgent = req.headers["user-agent"] || null;
      const data = await AuthService.login(req.body, ipAddress, userAgent);

      setRefreshTokenCookie(res, data.refreshToken);

      // Omit refresh token in json response as it is set as cookie
      sendSuccess(res, {
        accessToken: data.accessToken,
        user: data.user,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Rotates access and refresh tokens (RTR)
   */
  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Read from cookie first, fallback to request body
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: {
            code: "MISSING_REFRESH_TOKEN",
            message: "Session expired or missing refresh token.",
          },
        });
        return;
      }

      const ipAddress = req.ip || null;
      const userAgent = req.headers["user-agent"] || null;

      const data = await AuthService.refreshSession(refreshToken, ipAddress, userAgent);

      setRefreshTokenCookie(res, data.refreshToken);

      sendSuccess(res, {
        accessToken: data.accessToken,
      });
    } catch (err) {
      // Clear cookie if refresh check failed
      clearRefreshTokenCookie(res);
      next(err);
    }
  }

  /**
   * Logouts the current device session
   */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      clearRefreshTokenCookie(res);
      sendSuccess(res, { message: "Logged out successfully." });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Logouts all device sessions for the user
   */
  static async logoutAllDevices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.context.userId;
      if (userId) {
        await AuthService.logoutAllDevices(userId);
      }

      clearRefreshTokenCookie(res);
      sendSuccess(res, { message: "Successfully logged out from all active devices." });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieves active profile of currently logged-in user
   */
  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.context.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized access." } });
        return;
      }

      const data = await AuthService.getCurrentUser(userId);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Modifies account properties
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.context.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized access." } });
        return;
      }

      const data = await AuthService.updateProfile(userId, req.body);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Changes account password credentials
   */
  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.context.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized access." } });
        return;
      }

      await AuthService.changePassword(userId, req.body);
      sendSuccess(res, { message: "Password updated successfully." });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Requests verification instructions link
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.forgotPassword(req.body.email);
      sendSuccess(res, { message: "If matching account exists, password recovery instructions will be dispatched shortly." });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Resets password using verification token
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.resetPassword(req.body.token, req.body.password);
      sendSuccess(res, { message: "Password has been successfully updated." });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verifies email using verification token
   */
  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.query.token as string || req.body.token;
      if (!token) {
        res.status(400).json({ success: false, error: { code: "MISSING_VERIFY_TOKEN", message: "Verification token is required." } });
        return;
      }

      await AuthService.verifyEmail(token);
      sendSuccess(res, { message: "Email address successfully verified." });
    } catch (err) {
      next(err);
    }
  }
}
