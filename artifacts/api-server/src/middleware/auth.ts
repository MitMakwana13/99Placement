import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Fail fast at startup — never silently use a weak secret in any environment.
const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL: SESSION_SECRET environment variable is not set. Refusing to start.");
  process.exit(1);
}

export interface JwtPayload {
  employeeId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      employee?: JwtPayload;
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
    req.employee = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.employee) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!roles.includes(req.employee.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: "7d" });
}
