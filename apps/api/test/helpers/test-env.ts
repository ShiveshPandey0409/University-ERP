// Runs before the app is imported. Points the API at the isolated test DB/Redis.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://erp:erp_dev_password@localhost:5432/erp_test?schema=public";
process.env.REDIS_URL = process.env.TEST_REDIS_URL ?? "redis://localhost:6379/1";
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? "test-secret-at-least-16-characters-long";
process.env.JWT_ACCESS_TTL = "15m";
process.env.COOKIE_SECURE = "false";
process.env.LOGIN_RATE_MAX = process.env.LOGIN_RATE_MAX ?? "5";
