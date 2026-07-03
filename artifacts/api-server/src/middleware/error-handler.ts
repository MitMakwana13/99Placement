import { Request, Response, NextFunction } from "express";
import pino from "pino";

const logger = pino({ name: "error-handler" });

/**
 * Centralized Express error middleware.
 * Catches any error thrown or passed via next(err) from route handlers
 * and returns a consistent JSON ErrorResponse shape.
 * Must be registered AFTER all routes.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const status =
    err instanceof ApiHandlerError ? err.status :
    (typeof (err as any)?.status === "number" ? (err as any).status : 500);

  const message =
    err instanceof Error ? err.message : "Internal server error";

  logger.error(
    { method: req.method, url: req.url, status, err },
    "Unhandled route error"
  );

  // In production, don't leak internal error details on 5xx
  const body =
    status >= 500 && process.env.NODE_ENV === "production"
      ? { error: "Internal server error" }
      : { error: message };

  res.status(status).json(body);
}

/** Throw this from route handlers to send a specific HTTP status + message */
export class ApiHandlerError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiHandlerError";
  }
}
