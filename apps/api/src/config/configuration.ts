import { validateEnv } from "./env.validation.js";

export function configuration() {
  const env = validateEnv(process.env);
  return {
    nodeEnv: env.NODE_ENV,
    port: env.API_PORT,
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
    auth: {
      jwtSecret: env.JWT_ACCESS_SECRET,
      accessTtl: env.JWT_ACCESS_TTL,
      refreshTtlDays: env.REFRESH_TTL_DAYS,
      argon: {
        memoryCost: env.ARGON_MEMORY_COST,
        timeCost: env.ARGON_TIME_COST,
        parallelism: env.ARGON_PARALLELISM,
      },
      cookieDomain: env.COOKIE_DOMAIN,
      cookieSecure: env.COOKIE_SECURE,
    },
    cors: {
      origins: env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean),
    },
    rateLimit: {
      loginMax: env.LOGIN_RATE_MAX,
      loginWindowSec: env.LOGIN_RATE_WINDOW_SEC,
    },
  };
}

export type AppConfig = ReturnType<typeof configuration>;
