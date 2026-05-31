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

function numberEnv(name, fallback) {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new TypeError(`${name} must be a number`);
  }

  return parsed;
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: required("DATABASE_URL"),
    max: numberEnv("DB_POOL_MAX", 10),
    connectionTimeoutMillis: numberEnv("DB_CONNECTION_TIMEOUT_MS", 30000),
    idleTimeoutMillis: numberEnv("DB_IDLE_TIMEOUT_MS", 30000),
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
