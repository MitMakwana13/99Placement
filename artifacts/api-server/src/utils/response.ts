import { Response } from "express";

export interface ApiResponseEnvelope<T = unknown> {
  success: boolean;
  timestamp: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): void {
  const payload: ApiResponseEnvelope<T> = {
    success: true,
    timestamp: new Date().toISOString(),
    data,
  };
  res.status(statusCode).json(payload);
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}
