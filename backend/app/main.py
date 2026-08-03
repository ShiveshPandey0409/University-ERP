"""FastAPI application entrypoint.

Phase 0: app factory + DB health checks.
Later phases register module routers under app/routers/.
"""
from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["health"])
    def health() -> dict:
        return {"status": "ok", "app": settings.app_name, "env": settings.environment}

    @app.get("/health/db", tags=["health"])
    def health_db(db: Session = Depends(get_db)) -> dict:
        select1 = db.execute(text("SELECT 1")).scalar()
        tables = db.execute(text("SELECT COUNT(*) FROM sys.tables")).scalar()
        procs = db.execute(text("SELECT COUNT(*) FROM sys.procedures")).scalar()
        return {
            "database": settings.db_name,
            "select1": select1,
            "tables": tables,
            "procedures": procs,
        }

    from app.routers import (
        academics, admin, admission, auth, emarks, exam, grievance, menu, misc,
        payments, results, student,
    )

    app.include_router(auth.router)
    app.include_router(menu.router)
    app.include_router(admin.router)
    app.include_router(academics.router)
    app.include_router(student.router)
    app.include_router(payments.router)
    app.include_router(exam.router)
    app.include_router(emarks.router)
    app.include_router(results.router)
    app.include_router(grievance.router)
    app.include_router(misc.notices)
    app.include_router(misc.degree)
    app.include_router(misc.fees)
    app.include_router(admission.router)

    # In production the React build is served by the same process/origin as the
    # API. Keep this optional so Vite remains the development frontend.
    if settings.frontend_dist:
        dist = Path(settings.frontend_dist).resolve()
        index = dist / "index.html"
        assets = dist / "assets"
        if not index.is_file():
            raise RuntimeError(f"Frontend build not found: {index}")
        if assets.is_dir():
            app.mount("/assets", StaticFiles(directory=assets), name="frontend-assets")

        @app.get("/{full_path:path}", include_in_schema=False)
        def frontend(full_path: str) -> FileResponse:
            candidate = (dist / full_path).resolve()
            if candidate.is_relative_to(dist) and candidate.is_file():
                return FileResponse(candidate)
            return FileResponse(index)

    return app


app = create_app()
