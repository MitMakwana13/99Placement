import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { connectDatabase, disconnectDatabase } from "./config/database";

let server: ReturnType<typeof app.listen>;

async function bootstrap() {
  logger.info("🚀 Bootstrapping Express API server...");

  // 1. Connect to PostgreSQL via Prisma Client
  await connectDatabase();

  // 2. Start HTTP Listener
  server = app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        env: env.NODE_ENV,
        url: env.APP_URL,
      },
      "⚡ Server is running and listening for requests."
    );
  });
}

// Handle unexpected failures
process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "❌ Unhandled Promise Rejection. Shutting down...");
  gracefulShutdown();
});

process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "❌ Uncaught Exception. Shutting down...");
  gracefulShutdown();
});

// System signals
process.on("SIGTERM", () => {
  logger.warn("⚠️ SIGTERM received. Initiating graceful shutdown...");
  gracefulShutdown();
});

process.on("SIGINT", () => {
  logger.warn("⚠️ SIGINT received. Initiating graceful shutdown...");
  gracefulShutdown();
});

async function gracefulShutdown() {
  if (server) {
    server.close(async () => {
      logger.info("👋 HTTP server closed.");
      await disconnectDatabase();
      process.exit(0);
    });
    
    // Enforce shutdown after 10 seconds
    setTimeout(() => {
      logger.error("❌ Force shutting down after timeout.");
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

// Start the sequence
bootstrap().catch((error) => {
  logger.fatal({ error }, "❌ Bootstrap failure.");
  process.exit(1);
});
