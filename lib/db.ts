import { PrismaClient } from "@prisma/client";
import { neon } from "@neondatabase/serverless";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaNeonHttp } = require("@prisma/adapter-neon");

function createPrismaClient() {
  const sql = neon(process.env.DATABASE_URL!);
  const adapter = new PrismaNeonHttp(sql);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
