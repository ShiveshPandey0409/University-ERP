"""Audit logging — reimplements the legacy `log_insert` proc (writes USERSLOG)."""
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.system import UserLog

IST = timezone(timedelta(hours=5, minutes=30))


def now_ist() -> datetime:
    # naive IST wall-clock — SQL Server `datetime` columns don't hold a timezone
    return datetime.now(IST).replace(tzinfo=None)


def user_log(db: Session, uid: str | None, remark: str, ip: str | None = None) -> None:
    """Best-effort audit write; never break the request if logging fails."""
    try:
        db.add(
            UserLog(
                uid=(uid or "unknown")[:50],
                remarks=(remark or "")[:500],
                crat=now_ist().strftime("%Y-%m-%d %I:%M:%S %p"),
                ipadd=(ip or "-")[:30],
            )
        )
        db.commit()
    except Exception:
        db.rollback()
