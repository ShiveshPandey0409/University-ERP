# University ERP

A modern, scalable rebuild of the PTSNSU-style university ERP. Replaces the legacy
ASP.NET WebForms system with a type-safe monorepo whose defining property is
**server-side, default-deny authorization on every route** — the direct fix for the
legacy system that served admin pages without a session.

## Monorepo layout

```
apps/
  api/       NestJS (Fastify) API — auth, RBAC, audit, results vertical
  web/       Next.js 15 (App Router) — public portal + admin console
  worker/    (reserved) BullMQ background jobs
packages/
  shared/    Zod schemas + TS types + RBAC catalog (single source of truth)
  db/        Prisma schema, migrations, seed
  config/    shared eslint / tsconfig / tailwind presets
infra/
  docker-compose.yml   postgres, redis, minio, mailhog
```

## Prerequisites

- Node 20+, pnpm 9 (`corepack enable pnpm`)
- PostgreSQL 16 and Redis 7. Either:
  - **Docker:** `pnpm infra:up` (uses `infra/docker-compose.yml`), or
  - **Native (macOS):** `brew install postgresql@16 redis && brew services start postgresql@16 redis`

## Setup

```bash
pnpm install
cp .env.example .env

# create the app database + role (native Postgres example)
psql -d postgres -c "CREATE ROLE erp LOGIN PASSWORD 'erp_dev_password' CREATEDB;"
psql -d postgres -c "CREATE DATABASE erp OWNER erp;"

# build workspace libs, apply schema, seed sample data
pnpm --filter @erp/shared build
pnpm --filter @erp/db build
pnpm db:migrate
pnpm db:seed
```

The seed creates 16 roles, 65 permissions, a `superadmin` / `ChangeMe!2026` admin,
a `college1` college user, and sample results-vertical data (a course, students,
marks, and a published result).

## Run

```bash
# API on :4000, web on :3000 (web proxies /api → :4000 so cookies stay first-party)
pnpm --filter @erp/api dev      # or: node apps/api/dist/main.js after `nest build`
pnpm --filter @erp/web dev
```

Then:
- Public portal: http://localhost:3000  (try **Results** → enrollment `ENR2025001`, roll `R-001`)
- Admin console: http://localhost:3000/login/admin  (`superadmin` / `ChangeMe!2026`)

## How a route becomes reachable (default-deny)

Three global guards run on every request: `JwtAuthGuard → PermissionsGuard → ScopeGuard`.
The baseline for any handler is **401 then 403**. A route is served only if it:

- declares `@Public()` (auth bypass — the single audited escape hatch), or
- declares `@Permissions('module.resource.action')` the caller satisfies (and, for
  `@ScopedResource`, is within the caller's college scope).

A controller with no decorator is unreachable (403). A regression test enumerates the
live router and asserts every `/api/{admin,college,student}` route returns 401
unauthenticated and no route is silently unguarded.

## Tests

```bash
pnpm --filter @erp/shared test        # RBAC catalog unit tests
pnpm --filter @erp/api test           # unit
pnpm --filter @erp/api test:e2e       # e2e against a real Postgres+Redis (erp_test db)
```

The e2e suite prepares its own `erp_test` database via `prisma migrate deploy` + seed
(non-destructive) and covers: the 401 default-deny regression, refresh-token rotation +
reuse detection, live RBAC re-authorization, college scope isolation, and the results
flow (marks → separation-of-duties publish → public lookup).

## Environment

See `.env.example`. Key vars: `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`,
`API_INTERNAL_URL` (used by the web proxy), and `SEED_SUPERADMIN_*`.

## Modules

The full PTSNSU-style back-office surface (from the route maps in
`ptsnsuonline-*.md`) is implemented as default-deny verticals:

| Module | Public | Admin (`/api/admin/...`) | Key actions (distinct permissions) |
|---|---|---|---|
| Results | `/results` lookup | `marks/*`, `results/*` | enter marks → submit → approve/publish (SoD) |
| Admission | register applicant | `admission/applications` | verify · mark-deficiency · reject · merit generate |
| Enrollment | — | `enrollment/forms` | verify · reject · allocate enrollment number |
| Fees / RFT | — | `fees/*` | RFT issue · edit · print; transaction read |
| Degree | — | `degree/applications` | deliver · export |
| Grievance | `/grievance` register + track | `grievance` | assign · reply · close |
| Notices | `/notices` board | `notices` | write · publish · hide |

Each action is a separate permission in `packages/shared/src/rbac/permission-catalog.ts`
(the single source of truth for both the API guards and the DB seed). A regression
test enumerates the live router and asserts every admin route is 401 unauthenticated.

## Status

Milestones 1–2 (foundation, results, admission, enrollment, fees, degree, grievance,
notices) are implemented and tested (35 e2e tests). Remaining work (hardening,
college/FC scoped portals, legacy data migration) is tracked in
`claude-university-erp-rebuild-plan.md` and `concrete-execution-plan.md`.

## Deployment (Render)

`render.yaml` is a blueprint deploying the whole stack (Postgres 16, Key Value,
API, web). Migrations + seed run in the API start command (pre-deploy hooks need a
paid plan). The web service proxies `/api/*` to the API so the refresh cookie stays
first-party. On Render, set the web env `API_INTERNAL_URL` to the API's URL (private
DNS uses the service **name**, not the slug).
