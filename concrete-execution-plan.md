# Concrete End-to-End Execution Plan: University ERP Rebuild

Generated: 2026-07-04
Companion to: `claude-university-erp-rebuild-plan.md`, `ptsnsuonline-system-map.md`, `ptsnsuonline-deep-route-map.md`

Purpose: turn the rebuild prompt into a **concrete, sequenced, buildable plan** on a modern, scalable stack. The legacy ASP.NET WebForms / IIS / `.aspx` system is the *reference for business capability only* — none of it is reused. This document locks every open choice, closes the gaps that would otherwise stall a build midway, and gives an executable order of work with a definition of done per stage.

---

## 0. Requirement — restated in one paragraph

Rebuild the observed PTSNSU university ERP as a clean, modular, secure, horizontally scalable platform that preserves the same business capability across seven portals (Public, Student UiMS, Admission Applicant, Public Grievance, University Admin, College/FC, Reporting/Download) and the same operational modules (pre/post admission, enrollment, academic, examination, marks/results, fees/RFT, degree, grievance, notices, users/roles). It must enforce authorization **server-side on every route** (the legacy system returned `200 OK` on admin pages without a session — this is the #1 defect to fix architecturally), support multiple login levels with RBAC + scoped access, audit every privileged action, run heavy exports/reports as background jobs, store files behind signed URLs, and handle high-volume reporting. Everything below is how we build that without dead ends.

---

## 1. Locked technology decisions

The rebuild prompt lists several "A or B" choices. A concrete plan cannot ship on "or," so these are locked. Each pick favors scalability, type-safety end-to-end, and a small operational surface.

| Concern | Locked choice | Why this over the alternative |
|---|---|---|
| Monorepo | **pnpm workspaces + Turborepo** | One repo, shared types package, cached builds. |
| Frontend | **Next.js 15 (App Router) + TypeScript** | Server components for dense admin tables, one framework for 5 portals. |
| UI kit | **Tailwind CSS + shadcn/ui + TanStack Table + TanStack Query** | Dense operational tables with server-side pagination; not marketing pages. |
| Backend API | **NestJS (on Fastify adapter) + TypeScript** | Chose NestJS over bare Fastify: its module/guard/interceptor/DI model maps 1:1 to RBAC guards, per-route permission decorators, audit interceptors, and scope enforcement. Fastify adapter keeps throughput high. |
| ORM / migrations | **Prisma** (schema + migrations) with **raw SQL / views** for heavy reports | Type-safe models and first-class migrations; reporting queries drop to SQL where Prisma is inefficient. |
| Database | **PostgreSQL 16** | Full-text search first (per plan), partitioning for large tables later. |
| Cache / session / rate-limit | **Redis 7** | Refresh-token store, rate-limit counters, OTP store, BullMQ backend. |
| Background queue | **BullMQ (Redis-backed)** | Chosen over RabbitMQ/Kafka: no extra broker to operate; exports, report gen, email/SMS/OTP, marksheet PDF all fit. Kafka is a later swap only if event volume demands it. |
| Object storage | **S3-compatible** — AWS S3 in prod, **MinIO** in local/dev | Signed URLs, no public bucket. |
| Auth | **JWT access (15 min) + rotating opaque refresh token** (hashed in DB, httpOnly+Secure+SameSite cookie), **Argon2id** password hashing | Short access tokens + revocable refresh = sessions that expire and can be killed. |
| OTP / SMS / email | **Pluggable `NotificationProvider` port**; default SMS **MSG91** (India) / Twilio fallback; email **SES/SMTP** | Admission/PhD/private flows need OTP; provider is swappable per deployment. |
| Payments / refunds | **Pluggable `PaymentGateway` port**; default **Razorpay** adapter; **BillDesk / SBIePay** adapters for govt-treasury deployments | RFT/refund logic ties to the original gateway transaction; abstraction avoids lock-in. |
| Tests | **Vitest** (unit) + **Nest e2e / Supertest** (API) + **Testcontainers** (real Postgres/Redis) + **Playwright** (frontend e2e) | Real DB in CI catches migration/constraint bugs. |
| Observability | **pino** structured logs + **OpenTelemetry** traces + **Sentry** errors + audit events table | Meets the plan's observability requirement. |
| Deploy | **Docker** images; **Docker Compose** for dev; container orchestration (ECS/Fargate or k8s) in prod; **GitHub Actions** CI | Stateless API scales horizontally behind a load balancer; Postgres + Redis are the only stateful pieces. |

If a real deployment needs a specific govt payment gateway or SMS vendor, only the adapter changes — the core is untouched.

---

## 2. Gaps in the current plan that would cause a build to fail — and how each is closed

The rebuild prompt is strong on surface (routes, modules, tables) but leaves load-bearing business logic undefined. These are the things that make a build "fail end to end" if not resolved up front. Each now has a concrete resolution.

1. **Merit-list algorithm is undefined** (plan only says "reproducible").
   → Define a **deterministic, versioned Merit Engine**: inputs = `admission_session`, `round`, `course`, `category`, applicant scores/weights snapshot; output = ordered `merit_list_entries` with a stored `algorithm_version` and an immutable input snapshot hash. Same inputs → identical list. Tie-breaks are explicit (score → DOB → application number). Generation is a background job that writes a frozen snapshot; it never reads live-mutating data at print time.

2. **Legacy data migration is undefined** (system map notes source code/DB are missing).
   → Add **Phase 0 — Migration & Reconciliation** (below). ETL from the legacy SQL Server (once DB access is provided) into Postgres, with row-count reconciliation against observed live counts (e.g. ~402 grievances, 21 users, 28 roles, ~174 fee rows) and a dry-run report before cutover. Until DB access exists, we build against **seed + synthetic fixtures** so no phase is blocked.

3. **Payment ↔ refund/RFT linkage is undefined.**
   → `payment_transactions` are immutable; `refund_transactions` and `rft_requests` reference the original transaction and go through a state machine (`requested → approved → processed → printed`). Financial rows are never hard-deleted; corrections are new status rows.

4. **College scoping enforcement pattern is undefined** (only a `user_scopes` table is named).
   → Concrete two-layer enforcement: (a) a **`ScopeGuard`** that rejects out-of-scope IDs, and (b) a **Prisma query extension** that injects `collegeId in (user scopes)` into every scoped read/write so cross-tenant data cannot leak even if a handler forgets. Tested with a dedicated cross-tenant-leak e2e suite.

5. **The critical security defect** (admin pages returned `200` unauthenticated).
   → Architectural fix: **global default-deny**. A global `AuthGuard` + `PermissionGuard` are applied app-wide; a route is reachable only if it explicitly declares `@Public()` or `@Permissions(...)`. There is no "forgot to add a guard" failure mode — the default is 401/403.

6. **Session → round → seat-matrix model is undefined.**
   → `admission_sessions (1) → admission_rounds (N) → seat_matrix (per course/category/round)`. Admissions, merit, and reports all key off `(sessionId, roundId)`.

7. **Result publication approval is undefined.**
   → Explicit state machine on `result_publications`: `draft → pending_approval → published → (withheld_clear amendments)`. Publication requires a distinct approver permission from the marks-entry permission (separation of duties).

8. **Stack "or" choices** — resolved in §1.

9. **Column-level schema** — the plan lists table names only.
   → Conventions locked in §5; full column-level Prisma schema is authored per-module as each phase lands, not big-bang, so migrations stay reviewable.

10. **Header hardening / rate-limit specifics / CAPTCHA** — from the access-control findings.
    → Locked in §6 (security baseline): strip `x-powered-by`/version headers, `no-store` on authenticated responses, per-username+IP rate limits, reCAPTCHA on public admission/grievance/forgot-password forms.

---

## 3. Target architecture (one view)

```
apps/
  web/            Next.js — 5 layouts: Public, Student, Applicant, Admin, College
  api/            NestJS — modular monolith (split to services later if needed)
  worker/         BullMQ processors: exports, reports, PDFs, notifications
packages/
  shared/         Zod schemas + shared TS types (single source of truth, imported by web + api)
  db/             Prisma schema, migrations, seed
  config/         eslint/tsconfig/tailwind presets
infra/
  docker-compose.yml   postgres, redis, minio, mailhog
  Dockerfiles, CI workflows, deploy manifests
```

Runtime shape (scales horizontally): stateless `api` and `worker` replicas behind a load balancer; Postgres (primary + read replica for reports) and Redis are the only stateful services; S3 for files. Reports/exports never run in the request cycle — the API enqueues a job, the worker generates the file to S3, the user is notified and downloads via signed URL.

Start as a **modular monolith** (one Nest app, clear module boundaries). Only split a module into its own service if a real bottleneck appears. This avoids premature microservice complexity while keeping the seams clean.

---

## 4. Cross-cutting foundations (built once, used everywhere)

- **AuthN**: `POST /api/auth/{login,logout,refresh,forgot-password,reset-password,send-otp,verify-otp}`; Argon2id; refresh rotation with reuse-detection (revoke family on replay).
- **AuthZ**: global `AuthGuard` → `PermissionGuard` (`@Permissions('module.resource.action')`) → `ScopeGuard`. Default-deny. Permission strings follow `module.resource.action`.
- **Scoping**: `user_scopes` (collegeId/departmentId/sessionId) + Prisma query extension for automatic row filtering.
- **Audit**: a global interceptor writes `audit_logs` (`actorUserId, action, entityType, entityId, before, after, ip, userAgent, createdAt`) on every mutating, permissioned action.
- **Files**: `POST /api/files` (validate MIME + size + virus-scan hook → S3 → `files` row) and `GET /api/files/:id/download-url` (permission check → signed URL). No private object is ever public.
- **Reports/exports**: `POST /api/reports/jobs` → `export_jobs` row → BullMQ → S3 → notify. Status pollable.
- **Reusable UI** (shared): server-paginated DataTable, FilterPanel, ExportButton, StatusBadge, DocumentUpload, AuditTimeline, VerificationPanel, ConfirmModal, Print/Download actions, role-protected nav.

---

## 5. Database conventions (locked now, tables authored per-phase)

- Every table: `id uuid pk` (default `gen_random_uuid()`).
- Every mutable business table: `created_at, updated_at, created_by, updated_by`, plus `deleted_at` where soft-delete applies.
- Status changes → history rows (`*_status_history`). Financial + marks rows are **never hard-deleted**.
- Unique constraints (DB-enforced, per plan): enrollment number; application number; roll number per exam session; transaction order number; RFT number.
- Money as `numeric(12,2)`; never floats. All timestamps `timestamptz`, UTC.
- Large, ever-growing tables (`audit_logs`, `payment_transactions`, `marks_entries`) designed for range partitioning by period from day one.

---

## 6. Security baseline (fixes the legacy defects)

- Global default-deny authorization (see §4). A dedicated e2e test asserts **every** `/api/admin/*`, `/api/college/*`, `/api/student/*` route returns 401 when unauthenticated — this is the direct regression guard for the observed `200 OK` bug.
- Rate limiting per username **and** IP on auth + public search endpoints (Redis token bucket).
- reCAPTCHA on public admission, grievance, and forgot-password forms.
- MFA/OTP required for admin + finance logins.
- Response hardening: remove `x-powered-by` / framework-version headers; `Cache-Control: no-store` on authenticated responses; strict CORS allowlist; HSTS.
- Every privileged action audited; sessions expirable and revocable.

---

## 7. End-to-end build sequence (critical path)

Phases map to the plan's 10, plus **Phase 0** (migration) and a hardened foundation. Each phase lists concrete deliverables and a **Definition of Done (DoD)** = acceptance criteria that must pass (tests green) before moving on. Dependencies are explicit so nothing is built before its prerequisite.

### Phase 0 — Migration & Reconciliation (parallel track; unblocks cutover, not the build)
Deliver: legacy schema discovery (once SQL Server access is provided), ETL scripts SQL Server → Postgres, field mapping doc, reconciliation report (row counts vs. observed live counts), dry-run + rollback plan.
DoD: dry-run migrates into staging; counts reconcile within tolerance; report reviewed. *Blocked only on DB access — does not block Phases 1–9, which run on seed/synthetic data.*

### Phase 1 — Foundation ⟵ (no deps; everything depends on this)
Deliver: monorepo + Turborepo; Prisma schema for identity (`users, roles, permissions, role_permissions, user_roles, user_scopes, sessions, login_attempts, refresh_tokens, audit_logs`) + migrations; auth (login/logout/refresh/forgot/reset); global Auth+Permission+Scope guards; audit interceptor; Public + Admin layouts; seed of the 16 roles and their permissions; CI (lint, typecheck, unit, e2e with Testcontainers), Docker Compose dev env.
DoD: unauthenticated access to any admin/college/student API → 401 (automated); role-protected routes reject missing permissions; login + user changes are audited; CI green.

### Phase 2 — Master Data ⟵ depends on P1
Deliver: `academic/admission/exam_sessions`, `admission_rounds`, `colleges, departments, faculties, programs, courses, subjects, schemes, course_subjects, seat_matrix`, `fee_heads`, notice categories; admin CRUD screens with server-side pagination + filters; all writes audited.
DoD: admin manages all master data; every list paginated/filterable; all writes audited.

### Phase 3 — Public + Student UiMS ⟵ depends on P1, P2
Deliver: public notices, published-result lookup + search (rate-limited), UiMS registration lookup (`enrollment + DOB`), forgot password; Student layout + dashboard, profile, fees history, results/marksheet downloads (signed URL), documents, grievance create/track.
DoD: students see only their own records; public result lookup rate-limited; private docs require signed URL after permission check.

### Phase 4 — Admission ⟵ depends on P2 (+ Merit Engine spec from §2.1)
Deliver: applicant registration + OTP (regular/PhD/private flows), application form, document upload, seat-matrix-aware program selection; admin pre-admission verification (verify / mark-deficiency / reject), **Merit Engine** (deterministic, versioned, snapshotted), verification-user management; post-admission dashboard/list, subject selection, subject-change + cancellation workflows; Excel export via job.
DoD: application status history complete; verifier actions permission-checked + audited; **merit generation reproducible** (same inputs → identical list, asserted in tests).

### Phase 5 — Enrollment + Academic ⟵ depends on P4
Deliver: enrollment forms + verification + **enrollment-number allocation** (unique constraint enforced), PhD enrollment; academic student list, scheme verification (approve/remove), UG subject-selection tracking; exports.
DoD: no duplicate enrollment numbers (DB constraint + concurrency test); academic users filter/export; scheme approvals audited.

### Phase 6 — Examination ⟵ depends on P2, P5 + **College scoping (§2.4)**
Deliver: exam sessions + form-opening rules, student exam-form application, **college-scoped** verification, university exam dashboards, exam-details upload; student-type + payment-status filters.
DoD: college users see only their scoped college data (cross-tenant-leak suite passes); university users see permitted global data; exam-form status history complete.

### Phase 7 — Marks / Results ⟵ depends on P6
Deliver: marks-batch creation, college marks upload + validation (import validates rows before commit), marks entry (CCE/practical/project), correction workflow, withheld-clear, **result publication state machine** with separate approver permission, RV/RT print.
DoD: marks changes audited; imports validate before commit; publication requires explicit approval (separation of duties enforced).

### Phase 8 — Fees / RFT ⟵ depends on P2 + **PaymentGateway port (§2.3)**
Deliver: fee structures/master, transaction reports + search, payment history, gateway integration + reconciliation, **RFT issue workflow** (state machine, ties to original txn), RFT report, print/download via job.
DoD: financial rows immutable except controlled status updates; refund/RFT actions require finance permission + MFA; exports run as background jobs.

### Phase 9 — Grievance + Degree + Notices ⟵ depends on P1–P3
Deliver: public grievance registration (tracking number) + complaint assign/reply/close, degree list + delivery tracking, notice-board manager (add/edit/hide/publish, attachments).
DoD: complaints have tracking numbers; every reply/assignment logged; notices publish/hide safely.

### Phase 10 — Hardening & Launch ⟵ depends on all
Deliver: full permission review, rate limiting sweep, monitoring/alerts, backup + restore drill, migration cutover (Phase 0 → prod), load test, security test, deployment runbook + README.
DoD: no admin/college API reachable unauthenticated; no cross-tenant leakage; reports async; audit logs complete; backups restore in staging.

**Critical path:** P1 → P2 → P4 → P5 → P6 → P7 → P10. P3, P8, P9 run in parallel once their deps land. P0 runs alongside and only gates the final cutover.

---

## 8. Per-module verification checklist (applied to every module before its phase is "done")

Route guard · API permission guard · list pagination · filters · empty/loading/error states · create/update validation (Zod, shared) · audit log on write · export if required · file-access permission if files exist · role-specific visibility.

Per login level: correct login succeeds · wrong password fails · locked/disabled user fails · menu matches permissions · direct-URL access without permission fails · API access without permission fails · logout invalidates session.

Per report: filters validated · large reports run in background · generated file permission-checked · job status trackable.

---

## 9. Immediate next actions (first executable slice)

1. Scaffold the monorepo (`apps/web`, `apps/api`, `apps/worker`, `packages/{shared,db,config}`, `infra/docker-compose`).
2. Author the identity Prisma schema + first migration; seed the 16 roles and permission set.
3. Implement auth + global default-deny guards + audit interceptor.
4. Wire CI with Testcontainers and the **"every admin route is 401 unauthenticated"** regression test — the concrete proof that the legacy defect is fixed.
5. Stand up Public + Admin layouts as the shell for later modules.

That is Phase 1, and it is the foundation every other phase builds on. Once approved, this is where implementation starts.
