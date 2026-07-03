import { Request, Response, NextFunction, RequestHandler } from "express";
import { AppError } from "../utils/app-error";

export function requirePermission(requiredPermission: string): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // 1. Extract claims from authenticated user payload
    const userRole = (req.user as { role?: string })?.role;

    if (!userRole) {
      return next(AppError.unauthorized("Authentication required to verify permissions."));
    }

    // 2. Define standard system role permission mappings (RBAC permission matrix)
    const rolePermissions: Record<string, string[]> = {
      admin: ["*"], // Wildcard permissions for Tenant Administrator
      recruiter: [
        "candidates:read",
        "candidates:write",
        "jobs:read",
        "jobs:write",
        "interviews:read",
        "interviews:write",
        "assessments:read",
      ],
      interviewer: [
        "candidates:read",
        "jobs:read",
        "interviews:read",
        "interviews:write_feedback",
      ],
      client: [
        "jobs:read",
        "candidates:read",
      ],
    };

    const permissions = rolePermissions[userRole] || [];

    // Check if wildcard access or explicit match is present
    const hasPermission = permissions.includes("*") || permissions.includes(requiredPermission);

    if (!hasPermission) {
      return next(AppError.forbidden(`Access Denied: Lacks required permission '${requiredPermission}'`));
    }

    next();
  };
}
