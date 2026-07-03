import { Request, Response, NextFunction, RequestHandler } from "express";
import { randomUUID } from "crypto";

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export const requestId: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = (req.headers["x-request-id"] as string) || randomUUID();
  
  req.id = correlationId;
  res.setHeader("x-request-id", correlationId);
  
  next();
};
export default requestId;
