import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";
import { AppError } from "../utils/app-error";

// Preserve existing class for backward compatibility with current routes
export class ApiHandlerError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiHandlerError";
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  let statusCode = 500;
  let errorCode = "INTERNAL_SERVER_ERROR";
  let message = "An unexpected error occurred.";
  let details: unknown = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ApiHandlerError) {
    statusCode = err.status;
    errorCode = "API_HANDLER_ERROR";
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
    // Check if error has status field (standard packages like cookie-parser or helmet might set status)
    const customStatus = (err as { status?: number }).status;
    if (typeof customStatus === "number") {
      statusCode = customStatus;
    }
  }

  // Determine if we should show stack/message details in production
  const isProduction = process.env.NODE_ENV === "production";
  const displayMessage = (statusCode >= 500 && isProduction) ? "Internal server error" : message;

  logger.error(
    {
      method: req.method,
      url: req.url,
      statusCode,
      errorCode,
      err: err instanceof Error ? { message: err.message, stack: err.stack } : err,
    },
    "Unhandled error encountered"
  );

  res.status(statusCode).json({
    success: false,
    timestamp: new Date().toISOString(),
    error: {
      code: errorCode,
      message: displayMessage,
      ...(details ? { details } : {}),
      ...(!isProduction && err instanceof Error ? { stack: err.stack } : {}),
    },
  });
}
