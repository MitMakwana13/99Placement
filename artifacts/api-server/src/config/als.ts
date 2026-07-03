import { AsyncLocalStorage } from "async_hooks";

export interface LogContext {
  requestId: string;
  tenantId?: string;
  userId?: string;
}

export const logLocalStorage = new AsyncLocalStorage<LogContext>();
