"""Noticeboard — reimplemented from noticeboard_get / noticeboard_update (single-row HTML)."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.support import Notice


def get(db: Session, notice_id: int = 1) -> dict:
    n = db.get(Notice, notice_id)
    return {"id": notice_id, "details": n.details if n else None}


def update(db: Session, notice_id: int, details: str) -> dict:
    n = db.get(Notice, notice_id)
    if n is None:
        # single-row table; if missing, create one (identity assigns id)
        n = Notice(details=details)
        db.add(n)
        db.commit()
        db.refresh(n)
        return {"id": n.id, "details": details}
    n.details = details
    db.commit()
    return {"id": notice_id, "details": details}
