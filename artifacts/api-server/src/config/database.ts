import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info("🔌 Database connected successfully.");
  } catch (error) {
    logger.fatal({ error }, "❌ Database connection failed.");
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info("🔌 Database disconnected.");
}

export { prisma };
