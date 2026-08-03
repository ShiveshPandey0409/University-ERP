# Security / Hardening checklist (v2)

The rebuild already fixes several issues from the legacy app; the rest are tracked here
for production hardening.

## Already fixed vs legacy
- **JWT** replaces session-only auth; short-lived access + refresh tokens.
- **Master-password backdoors** (`p8715t` / `p9211t`) are NOT ported.
- **Parameterized queries everywhere** (SQLAlchemy) — the legacy SQL-injection sites
  (`VeriUsers` UROLLS rebuild, grievance `TOP N`) do not exist here.
- **RBAC** enforced centrally via `require_roles()` dependencies, not per-page copy-paste.
- **No SSRF `ViewDoc`** open-proxy equivalent.

## To do before production
1. **Secrets → env/secret store.** `app/core/config.py` ships dev defaults for
   `DB_PASSWORD`, `JWT_SECRET`, `SABPAISA_*`, and the legacy AES key. In prod, set them
   via environment only (never commit real values). `.env` files are gitignored.
2. **Password hashing.** Login still verifies legacy plaintext. To finish:
   run `database/migrations/001_widen_password.sql` (widens `USERS.PASSWORD` to
   varchar(100)), then re-enable the bcrypt-on-login upgrade in
   `auth_service.authenticate()` (the code path exists; `verify_password` already accepts
   both plaintext and bcrypt). A one-time bulk-hash job finishes the rest.
3. **HTTPS + secure cookies / token storage.** Serve behind TLS; consider httpOnly
   refresh-token cookies instead of localStorage.
4. **CORS** locked to the real front-end origin (currently `http://localhost:5173`).
5. **SabPaisa callback** — add signature/HMAC verification beyond the AES envelope; the
   server already re-validates amount + enrollment against the stored order.
6. **Rate-limit** `/auth/login` and the public grievance register.
7. **Tighten role gates** — some read endpoints use `get_current_user` (any authenticated
   staff); map them to the exact legacy role IDs where needed.
8. **DB integrity (later track)** — add PKs/FKs, standardize `COURSE_ID` typing, drop the
   ~17 ad-hoc/junk tables (see main-DB memo).
