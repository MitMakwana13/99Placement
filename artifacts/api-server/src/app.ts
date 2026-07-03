import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";

import router from "./routes";
import { env } from "./config/env";
import { corsOptions } from "./config/cors";
import { logger } from "./config/logger";
import { requestId } from "./middleware/requestId";
import { requireTenant } from "./middleware/tenant";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/404-handler";

const app: Express = express();

// 1. Request Context Correlation ID
app.use(requestId);

// 2. HTTP Logger
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id || "unassigned",
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
          tenantId: req.headers["x-tenant-id"],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);

// 3. Security Headers
app.use(helmet());

// 4. Cross-Origin Resource Sharing
app.use(cors(corsOptions));

// 5. Payload Compression
app.use(compression());

// 6. Request Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// 7. Global API Rate Limiter
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === "production" ? 1000 : 5000, // limit each IP requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    timestamp: new Date().toISOString(),
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests from this IP. Please try again after 15 minutes.",
    },
  },
});
app.use("/api/v1", globalRateLimiter);

// 8. Core Application Router (Version 1)
app.use("/api/v1", router);

// Global health endpoint check for orchestrators
import healthRouter from "./routes/health";
app.use(healthRouter);

// 9. Unmatched Route Fallback Interceptor
app.use(notFoundHandler);

// 10. Centralized Error Handler (must reside after all handlers)
app.use(errorHandler);

export default app;
export { app };
