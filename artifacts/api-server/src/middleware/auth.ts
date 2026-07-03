import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { verifyAccessToken, JwtPayload } from "../utils/jwt";
import { RbacService } from "../services/rbac.service";
import { logLocalStorage } from "../config/als";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      employee?: {
        employeeId: string;
        email: string;
        role: string;
      };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    
    // Populate request context parameters
    if (req.context) {
      req.context.userId = payload.userId;
      req.context.role = payload.role;
      req.context.tenantId = payload.tenantId;
      
      const store = logLocalStorage.getStore();
      if (store) {
        store.tenantId = payload.tenantId;
        store.userId = payload.userId;
      }
      
      // Load user permissions dynamically into the context
      try {
        req.context.permissions = await RbacService.getUserPermissions(payload.userId);
      } catch (err) {
        req.context.permissions = [];
      }
    }
    
    // Maintain backward compatibility with legacy Drizzle routes
    req.employee = {
      employeeId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    
    const hasRole = roles.includes(req.user.role) || roles.includes(req.user.systemRole);
    if (!hasRole) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

export function signToken(payload: { userId: string; email: string; role: string; tenantId: string }): string {
  return jwt.sign({ ...payload, systemRole: payload.role }, env.JWT_SECRET, { expiresIn: "7d" });
}
