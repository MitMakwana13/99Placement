import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

export const prisma = basePrisma.$extends({
  query: {
    async $allOperations({ model, operation, args, query }: { model?: any; operation: string; args: any; query: any }) {
      const start = performance.now();
      try {
        return await query(args);
      } finally {
        const duration = (performance.now() - start).toFixed(2);
        if (process.env.NODE_ENV !== "test") {
          // Log query duration to stdout in non-test environments
          console.log(`[DB] ${model || "Raw"}.${operation} execution time: ${duration}ms`);
        }
      }
    },
  },
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma;

export * from "@prisma/client";
