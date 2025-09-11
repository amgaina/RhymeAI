import { PrismaClient } from "@prisma/client";

// Prevent multiple instances of Prisma Client in development
declare global {
  var cachedPrisma: PrismaClient;
}

// Use cached client to avoid too many connections in development
export const db =
  global.cachedPrisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// Only cache in development to prevent memory leaks in production
if (process.env.NODE_ENV !== "production") {
  global.cachedPrisma = db;
}
