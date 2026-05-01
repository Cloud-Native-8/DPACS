import { PrismaPg } from "@prisma/adapter-pg";
import prismaClientPackage from "@prisma/client";

const { PrismaClient } = prismaClientPackage;

const globalForPrisma = globalThis;

function required(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: required("DATABASE_URL"),
    max: Number(process.env.DB_POOL_MAX || 10),
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
