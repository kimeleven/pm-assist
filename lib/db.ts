import { PrismaClient } from "@prisma/client";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaNeonHttp } = require("@prisma/adapter-neon");

function createPrismaClient() {
  // Prisma 7 + @prisma/adapter-neon 7: 어댑터가 connection string 직접 받음
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
