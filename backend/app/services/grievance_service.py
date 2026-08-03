"""Grievance — reimplemented from complaint_register / complaint_status /
complaint_list_admin / complaint_update. 'Open' = STATUS 'Replied' or NULL."""
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.audit import now_ist
from app.models.support import Complaint, ComplaintCateg

OPEN = or_(Complaint.status == "Replied", Complaint.status.is_(None))


class NotFoundError(Exception):
    pass


def categories(db: Session) -> list[ComplaintCateg]:
    return list(
        db.execute(
            select(ComplaintCateg).where(ComplaintCateg.status == "Y").order_by(ComplaintCateg.sort)
        ).scalars()
    )


def status_counts(db: Session) -> dict:
    def c(*w):
        return db.execute(select(func.count()).select_from(Complaint).where(*w)).scalar() or 0

    opened = c(OPEN)
    closed = c(Complaint.status == "Closed")
    assigned = c(OPEN, Complaint.assign.isnot(None))
    return {
        "opened": opened,
        "closed": closed,
        "assigned": assigned,
        "not_assigned": max(opened - assigned, 0),
    }


def list_admin(db: Session, *, status=None, category=None, limit=100) -> list[Complaint]:
    stmt = select(Complaint)
    conds = []
    if status == "Open":
        conds.append(OPEN)
    elif status:
        conds.append(Complaint.status == status)
    if category:
        conds.append(Complaint.category == category)
    if conds:
        stmt = stmt.where(*conds)
    return list(db.execute(stmt.order_by(Complaint.id.desc()).limit(limit)).scalars())


def register(db: Session, *, enroll_no, category, remarks, file_name, crby) -> int:
    """Returns the new complaint id, or 0 if the student already has 2 open complaints."""
    open_count = db.execute(
        select(func.count()).select_from(Complaint).where(Complaint.enroll_no == enroll_no, OPEN)
    ).scalar() or 0
    if open_count >= 2:
        return 0
    c = Complaint(enroll_no=enroll_no, details=remarks, crat=now_ist(),
                  crby=crby, flname=file_name, category=category)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c.id


def update(db: Session, *, complaint_id, remarks=None, status=None, assign=None, by) -> Complaint:
    c = db.get(Complaint, complaint_id)
    if c is None:
        raise NotFoundError("Complaint not found")
    if assign is not None:
        c.assign = assign
    if status is not None:
        c.status = status
    if remarks:
        stamp = now_ist().strftime("%Y-%m-%d %H:%M")
        c.details = f"{c.details or ''}\n[{by} @ {stamp}] {remarks}"
    c.updby = by
    c.updat = now_ist()
    db.commit()
    db.refresh(c)
    return c
