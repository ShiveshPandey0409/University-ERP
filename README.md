# PTSNSU ERP v2

A ground-up rebuild of the PTSNSU University Information Management System on a modern stack,
**reusing the existing database as-is** so it works end-to-end first. Table
normalization/cleanup is a deliberate later track.

**Stack:** React (Vite + TypeScript + MUI) · FastAPI (Python) · SQL Server 2022 (Docker/Render private service).

```
backend/    FastAPI — logic reimplemented from the legacy procs (procs = spec)
frontend/   React SPA — same screens as the current app, modern UI
docs/        DATA_MODEL.md and module/parity specs
Dockerfile  production image containing the React build + FastAPI + ODBC Driver 18
render.yaml Render Blueprint for the web app and private SQL Server service
```

The legacy database dump and local database tooling are intentionally excluded from
the GitHub repository. They contain private university data and are transferred to
the private database service separately during initial deployment.

## Quick start
1. **Database** — start the private/local SQL Server dataset supplied separately by
   the system owner. The API expects `PSNSUniversityOnline` on port 1433.
2. **Backend** — see `backend/README.md` (needs ODBC Driver 18). `uvicorn app.main:app --reload` → http://localhost:8000/docs
3. **Frontend** — see `frontend/README.md`. `npm run dev` → http://localhost:5173

## Render deployment

`render.yaml` provisions a private SQL Server service with a persistent disk and a
public Docker web service. Database data is not baked into the image or committed to
Git. After provisioning, import the private dump into SQL Server, then verify
`/health`, `/health/db`, and the staff/student login flows.

## Build phases
Tracked as tasks; plan at `~/.claude/plans/make-a-concrete-step-imperative-brooks.md`.
Phase 0 (scaffold + DB load) → 1 (auth/RBAC/shell) → 2 (master+students) → 3 (student+payments)
→ 4 (exam+marks) → 5 (results+print) → 6 (fees/degree/grievance/notices) → 7 (admission, needs
`PtsnsuAdmission` dump) → 8 (parity QA + hardening).

Source app being cloned: `../PTSNSU_ERP` (ASP.NET Web Forms).
