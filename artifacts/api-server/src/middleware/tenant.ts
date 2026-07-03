import { Request, Response, NextFunction, RequestHandler } from "express";
import { AppError } from "../utils/app-error";

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

export const requireTenant: RequestHandler = (req: Request, _res: Response, next: NextFunction): void => {
  // 1. Retrieve from request headers
  let tenantId = req.headers["x-tenant-id"] as string | undefined;

  // 2. Fallback to auth payload claims if already parsed by auth middleware
  if (!tenantId && req.user && typeof (req.user as { tenantId?: string }).tenantId === "string") {
    tenantId = (req.user as { tenantId: string }).tenantId;
  }

  // 3. Fallback to legacy req.employee
  if (!tenantId && req.employee && typeof (req.employee as unknown as { tenantId?: string }).tenantId === "string") {
    tenantId = (req.employee as unknown as { tenantId: string }).tenantId;
  }

  if (!tenantId) {
    return next(AppError.badRequest("Missing tenant identification header: x-tenant-id", "MISSING_TENANT_ID"));
  }

  // Enforce basic UUID format check
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(tenantId)) {
    return next(AppError.badRequest("Invalid tenant identification format.", "INVALID_TENANT_ID"));
  }

  req.tenantId = tenantId;
  if (req.context) {
    req.context.tenantId = tenantId;
  }
  next();
};
