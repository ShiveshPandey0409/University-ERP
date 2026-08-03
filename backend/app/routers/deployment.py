"""Temporary, token-protected database bootstrap endpoints for Render."""
import asyncio
import hashlib
import hmac
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
from threading import Lock

from fastapi import APIRouter, Header, HTTPException, Request, status
from fastapi.responses import FileResponse

from app.core.config import settings


router = APIRouter(prefix="/internal/deployment", tags=["deployment"])
_archive_path = Path("/tmp/ptsnsu-db-import.tgz")
_work_dir = Path("/tmp/ptsnsu-db-import")
_max_archive_bytes = 100 * 1024 * 1024
_state_lock = Lock()
_state: dict[str, object] = {"status": "idle", "phase": None, "error": None}
_task: asyncio.Task[None] | None = None


def _authorize(token: str | None) -> None:
    expected = settings.deploy_import_token
    if not expected or not token or not hmac.compare_digest(token, expected):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)


def _set_state(**values: object) -> None:
    with _state_lock:
        _state.update(values)


def _extract_expected_files() -> tuple[Path, Path]:
    if _work_dir.exists():
        shutil.rmtree(_work_dir)
    _work_dir.mkdir(mode=0o700)
    expected = {
        "load/backup_ready.sql": _work_dir / "backup_ready.sql",
        "reconstruct_admission.sql": _work_dir / "reconstruct_admission.sql",
    }
    with tarfile.open(_archive_path, "r:gz") as archive:
        for member_name, destination in expected.items():
            member = archive.getmember(member_name)
            source = archive.extractfile(member)
            if source is None or not member.isfile():
                raise RuntimeError(f"Archive member is not a file: {member_name}")
            with destination.open("wb") as output:
                shutil.copyfileobj(source, output)
    return expected["load/backup_ready.sql"], expected["reconstruct_admission.sql"]


def _run_sql_file(path: Path) -> None:
    process_env = os.environ.copy()
    process_env["SQLCMDPASSWORD"] = settings.db_password
    result = subprocess.run(
        [
            "/opt/mssql-tools18/bin/sqlcmd",
            "-S", f"{settings.db_host},{settings.db_port}",
            "-U", settings.db_user,
            "-C", "-b", "-r", "1", "-i", str(path),
        ],
        env=process_env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        text=True,
        timeout=3600,
        check=False,
    )
    if result.returncode:
        detail = (result.stderr or "sqlcmd failed").strip()[-2000:]
        raise RuntimeError(f"sqlcmd exited {result.returncode}: {detail}")


def _run_import() -> None:
    try:
        _set_state(status="running", phase="extracting", error=None)
        primary, admission = _extract_expected_files()
        _set_state(phase="primary-database")
        _run_sql_file(primary)
        _set_state(phase="admission-database")
        _run_sql_file(admission)
        _set_state(status="complete", phase="finished", error=None)
    except Exception as exc:
        _set_state(status="failed", phase="failed", error=str(exc)[-2000:])


@router.put("/database-archive")
async def upload_database_archive(
    request: Request,
    x_import_token: str | None = Header(default=None),
) -> dict[str, object]:
    _authorize(x_import_token)
    size = 0
    digest = hashlib.sha256()
    with _archive_path.open("wb") as output:
        async for chunk in request.stream():
            size += len(chunk)
            if size > _max_archive_bytes:
                output.close()
                _archive_path.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="Archive is too large")
            digest.update(chunk)
            output.write(chunk)
    _set_state(status="uploaded", phase="ready", error=None)
    return {"status": "uploaded", "bytes": size, "sha256": digest.hexdigest()}


@router.get("/database-archive", response_class=FileResponse)
def download_database_archive(
    x_import_token: str | None = Header(default=None),
) -> FileResponse:
    _authorize(x_import_token)
    if not _archive_path.is_file():
        raise HTTPException(status_code=404, detail="Archive has not been uploaded")
    return FileResponse(_archive_path, media_type="application/gzip")


@router.post("/database-import", status_code=status.HTTP_202_ACCEPTED)
async def start_database_import(
    x_import_token: str | None = Header(default=None),
) -> dict[str, object]:
    global _task
    _authorize(x_import_token)
    if not _archive_path.is_file():
        raise HTTPException(status_code=409, detail="Archive has not been uploaded")
    with _state_lock:
        if _state["status"] == "running":
            raise HTTPException(status_code=409, detail="Import is already running")
    _set_state(status="running", phase="queued", error=None)
    _task = asyncio.create_task(asyncio.to_thread(_run_import))
    return {"status": "running"}


@router.get("/database-import")
def database_import_status(
    x_import_token: str | None = Header(default=None),
) -> dict[str, object]:
    _authorize(x_import_token)
    with _state_lock:
        return dict(_state)
