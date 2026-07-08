import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createTestApp } from "./helpers/test-app.factory.js";
import { collectRoutes } from "./helpers/route-collector.js";

const DUMMY_ID = "00000000-0000-0000-0000-000000000000";

describe("authorization boundary", () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app?.close();
  });

  it("exposes no unguarded authenticated route (misconfiguration-deny)", () => {
    const offenders = collectRoutes(app).filter(
      (r) => !r.isPublic && !r.authOnly && r.permissions.length === 0,
    );
    expect(offenders, `Unguarded routes found: ${JSON.stringify(offenders, null, 2)}`).toHaveLength(
      0,
    );
  });

  it("returns 401 for every admin/college/student route without credentials", async () => {
    const routes = collectRoutes(app).filter(
      (r) => !r.isPublic && /^\/api\/(admin|college|student)/.test(r.path),
    );
    expect(routes.length).toBeGreaterThan(0);

    for (const route of routes) {
      const url = route.path.replace(/:[A-Za-z0-9_]+/g, DUMMY_ID);
      const method = route.method.toLowerCase() as "get" | "post" | "put" | "patch" | "delete";
      const res = await request(app.getHttpServer())[method](url).send({});
      expect(res.status, `${route.method} ${url}`).toBe(401);
    }
  });
});
