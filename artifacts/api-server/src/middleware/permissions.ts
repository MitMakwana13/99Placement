import { Request, Response, NextFunction, RequestHandler } from "express";
import { AppError } from "../utils/app-error";
import { RbacService } from "../services/rbac.service";

export function requirePermission(requiredPermission: string): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // 1. Check if permissions are cached in Request Context
    if (req.context?.permissions) {
      if (req.context.permissions.includes(requiredPermission)) {
        return next();
      }
      return next(AppError.forbidden(`Access Denied: Lacks required permission '${requiredPermission}'`));
    }

    // 2. Database query fallback if permissions are not populated in context
    const userId = req.context?.userId || req.user?.userId;

    if (!userId) {
      return next(AppError.unauthorized("Authentication required to verify permissions."));
    }

    try {
      const hasPerm = await RbacService.hasPermission(userId, requiredPermission);
      if (!hasPerm) {
        return next(AppError.forbidden(`Access Denied: Lacks required permission '${requiredPermission}'`));
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
