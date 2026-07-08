import { z } from "zod";

const boolFromEnv = z
  .union([z.boolean(), z.string()])
  .transform((v) => v === true || v === "true")
  .default(false);

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default("15m"),
  REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  ARGON_MEMORY_COST: z.coerce.number().int().positive().default(19456),
  ARGON_TIME_COST: z.coerce.number().int().positive().default(2),
  ARGON_PARALLELISM: z.coerce.number().int().positive().default(1),
  COOKIE_DOMAIN: z.string().default("localhost"),
  COOKIE_SECURE: boolFromEnv,
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  LOGIN_RATE_MAX: z.coerce.number().int().positive().default(5),
  LOGIN_RATE_WINDOW_SEC: z.coerce.number().int().positive().default(300),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration:\n${parsed.error.toString()}`);
  }
  return parsed.data;
}
