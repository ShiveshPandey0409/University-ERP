# Backend (FastAPI)

FastAPI + SQLAlchemy over the existing SQL Server DB. Business logic is
**reimplemented in Python** in `app/services/` (the legacy stored procedures are
the behavioral spec; we don't call them at runtime).

## Prerequisites
- Python 3.11+
- **Microsoft ODBC Driver 18 for SQL Server** on the host:
  ```bash
  brew tap microsoft/mssql-release https://github.com/Microsoft/homebrew-mssql-release
  brew update && brew install msodbcsql18
  ```
- The database running (see `../database/README.md`).

## Run
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # set JWT_SECRET, confirm DB creds
uvicorn app.main:app --reload   # http://localhost:8000  (Swagger at /docs)
```

## Verify (Phase 0)
```bash
curl localhost:8000/health
curl localhost:8000/health/db   # -> {"tables":57,"procedures":184,...}
```

## Layout
```
app/core         config, security(JWT), rbac, aes_compat, audit
app/db           engine/session (pyodbc -> SQL Server)
app/models       ORM mapped to EXISTING tables
app/schemas      Pydantic request/response
app/services     business logic reimplemented from the procs
app/routers      REST endpoints per module
app/integrations sabpaisa, email(SES), sms(smartping), pdf, excel, filestore
```
