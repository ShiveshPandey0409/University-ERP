"""Degree/convocation — reimplemented from degree_dashboard / degree_list.
Active applications have STATUS in ('PAID','UPDATE); workflow: verified -> delivered."""
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.support import Degree

ACTIVE = or_(Degree.status == "PAID", Degree.status == "UPDATE")


def dashboard(db: Session) -> dict:
    def c(*w):
        return db.execute(select(func.count()).select_from(Degree).where(ACTIVE, *w)).scalar() or 0

    return {
        "applied": c(),
        "pending": c(Degree.verified.is_(None)),
        "printing": c(Degree.verified == "Y", Degree.delivered.is_(None)),
        "delivered": c(Degree.verified == "Y", Degree.delivered == "Y"),
    }


def list_degrees(db: Session, *, status=None, search=None, limit=100) -> list[dict]:
    stmt = select(Degree).where(ACTIVE)
    if status == "pending":
        stmt = stmt.where(Degree.verified.is_(None))
    elif status == "printing":
        stmt = stmt.where(Degree.verified == "Y", Degree.delivered.is_(None))
    elif status == "delivered":
        stmt = stmt.where(Degree.delivered == "Y")
    if search:
        like = f"%{search.strip()}%"
        stmt = stmt.where(or_(Degree.enroll_no.like(like), Degree.rollno.like(like), Degree.name.like(like)))
    stmt = stmt.order_by(Degree.id.desc()).limit(limit)

    return [
        {
            "id": d.id, "enroll_no": d.enroll_no, "rollno": d.rollno, "name": d.name,
            "course": d.course, "subject": d.subject, "degree_year": d.degree_year,
            "degree_type": d.degree_type, "division": d.division, "status": d.status,
            "verified": d.verified, "delivered": d.delivered, "cert_no": d.cert_no,
        }
        for d in db.execute(stmt).scalars()
    ]
