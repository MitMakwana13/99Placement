import { Request, Response, NextFunction, RequestHandler } from "express";
import { randomUUID } from "crypto";
import { logLocalStorage } from "../config/als";

export interface RequestContext {
  requestId: string;
  tenantId?: string;
  userId?: string;
  role?: string;
  permissions?: string[];
  ip?: string;
  userAgent?: string;
  device?: string;
  requestTime: Date;
}

declare global {
  namespace Express {
    interface Request {
      id?: string;
      context: RequestContext;
    }
  }
}

export const requestId: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = (req.headers["x-request-id"] as string) || randomUUID();
  
  req.id = correlationId;
  res.setHeader("x-request-id", correlationId);
  
  const userAgent = req.headers["user-agent"] || "";
  let device = "Desktop";
  if (/mobile/i.test(userAgent)) {
    device = "Mobile";
  } else if (/tablet/i.test(userAgent)) {
    device = "Tablet";
  }
  
  // Initialize global request context envelope
  req.context = {
    requestId: correlationId,
    ip: req.ip || req.socket.remoteAddress || undefined,
    userAgent: userAgent || undefined,
    device,
    requestTime: new Date(),
  };
  
  logLocalStorage.run(
    {
      requestId: correlationId,
    },
    () => {
      next();
    }
  );
};
export default requestId;
