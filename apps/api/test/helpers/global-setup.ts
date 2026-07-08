import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@erp/db";
import { Redis } from "ioredis";

/**
 * Prepares the dedicated test database once before the e2e suite:
 *  1. `migrate deploy` — non-destructive; applies the schema to erp_test.
 *  2. seed — idempotent roles/permissions/bootstrap users.
 *  3. clean volatile + test-created rows (via the client, not the guarded CLI).
 *  4. flush the test Redis db so rate-limit/session keys don't leak across runs.
 */
export default async function setup(): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = resolve(here, "../../../..");
  const databaseUrl =
    process.env.TEST_DATABASE_URL ??
    "postgresql://erp:erp_dev_password@localhost:5432/erp_test?schema=public";
  const redisUrl = process.env.TEST_REDIS_URL ?? "redis://localhost:6379/1";

  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    NODE_ENV: "test",
    SEED_SUPERADMIN_USERNAME: "superadmin",
    SEED_SUPERADMIN_EMAIL: "superadmin@erp.local",
    SEED_SUPERADMIN_PASSWORD: "Test!2026",
  };

  execSync("pnpm --filter @erp/db exec prisma migrate deploy", { cwd: root, env, stdio: "inherit" });
  execSync("pnpm --filter @erp/db exec tsx prisma/seed.ts", { cwd: root, env, stdio: "inherit" });

  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    await prisma.$executeRawUnsafe(
      "TRUNCATE TABLE sessions, refresh_tokens, login_attempts, audit_logs RESTART IDENTITY CASCADE",
    );
    await prisma.user.deleteMany({
      where: { username: { in: ["rbacuser", "marksuser", "examuser", "mduser", "vcuser"] } },
    });
    // Test-created rows that would otherwise collide on unique keys next run.
    await prisma.course.deleteMany({ where: { code: "BSC-PHY" } });
    await prisma.college.deleteMany({ where: { code: "COL-TEST" } });
    await prisma.resultPublication.deleteMany({ where: { semester: 2 } });
    await prisma.examForm.deleteMany({ where: { rollNumber: { startsWith: "R-CRUD" } } });
    await prisma.student.deleteMany({ where: { enrollmentNumber: { startsWith: "ENR-CRUD" } } });
    await prisma.marksBatch.deleteMany({ where: { subject: { code: "CS-102" } } });
  } finally {
    await prisma.$disconnect();
  }

  const redis = new Redis(redisUrl);
  try {
    await redis.flushdb();
  } finally {
    redis.disconnect();
  }
}
