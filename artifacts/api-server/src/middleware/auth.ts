import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@workspace/db-prisma";

// Fail fast at startup — never silently use a weak secret in any environment.
const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL: SESSION_SECRET environment variable is not set. Refusing to start.");
  process.exit(1);
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  tenantId: string;
}

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

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET!) as JwtPayload;
    req.user = payload;
    
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

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: "7d" });
}
