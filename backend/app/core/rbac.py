"""Role checks — reimplements `uroll_check` / user-role lookups against UROLLS."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.system import UserRole


def get_user_roles(db: Session, uid: str) -> list[int]:
    rows = db.execute(select(UserRole.uroll).where(UserRole.uid == uid)).scalars().all()
    return sorted({int(r) for r in rows if r is not None})


def has_role(db: Session, uid: str, role_id: int) -> bool:
    return role_id in get_user_roles(db, uid)
