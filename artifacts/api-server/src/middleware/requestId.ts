import { Request, Response, NextFunction, RequestHandler } from "express";
import { randomUUID } from "crypto";

export interface RequestContext {
  requestId: string;
  tenantId?: string;
  userId?: string;
  role?: string;
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
  
  // Initialize global request context envelope
  req.context = {
    requestId: correlationId,
  };
  
  next();
};
export default requestId;
