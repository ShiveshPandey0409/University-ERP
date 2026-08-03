# Frontend (React + Vite + TypeScript + MUI)

Modern SPA that reproduces the current ERP's screens. Talks to the FastAPI backend;
`/api` is proxied to `http://localhost:8000` in dev (see `vite.config.ts`).

## Run
```bash
npm install
cp .env.example .env
npm run dev            # http://localhost:5173
```
(Backend must be running — see `../backend/README.md`.)

## Structure
```
src/app        App, providers (theme, query client, AuthContext), router
src/api        typed API client (axios) + per-module calls
src/layout     AppShell — header + role-based sidebar (menu from /menu)
src/components  reusable (ProtectedRoute; DataTable/FormKit added in Phase 2)
src/features   one folder per module (auth, dashboard, students, ...)
```

## Phase 1 status
Login → JWT → AppShell + dynamic role-based sidebar → Dashboard. Module screens
(students, exam, fees, ...) are added per phase, mirroring the current app's screens.
