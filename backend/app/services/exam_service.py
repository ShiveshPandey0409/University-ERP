"""Exam operations — reimplemented from exam_form_verify / exam_frm_list / exam_dashboard."""
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.models.academic import Enrollment
from app.models.student import Student


def list_forms(db: Session, *, session=None, course_id=None, semester=None,
               verify=None, limit=300) -> list[dict]:
    stmt = select(Enrollment, Student.name).outerjoin(
        Student, Student.enroll_no == Enrollment.enroll_no
    )
    conds = []
    if session:
        conds.append(Enrollment.session == session)
    if course_id:
        conds.append(Enrollment.course_id == course_id)
    if semester:
        conds.append(Enrollment.semester == semester)
    if verify == "Y":
        conds.append(Enrollment.verify == "Y")
    elif verify == "N":
        conds.append(Enrollment.verify.is_(None))
    if conds:
        stmt = stmt.where(*conds)
    stmt = stmt.order_by(Enrollment.roll_no).limit(limit)

    return [
        {
            "pk": e.pk, "enroll_no": e.enroll_no, "name": nm, "roll_no": e.roll_no,
            "session": e.session, "course_id": e.course_id, "semester": e.semester,
            "exam_form": e.exam_form, "form_status": e.form_status, "verify": e.verify,
        }
        for e, nm in db.execute(stmt).all()
    ]


def verify_form(db: Session, pk: int, by: str) -> int:
    """Reimpl exam_form_verify: mark a paid form verified (idempotent on VERIFY IS NULL)."""
    res = db.execute(
        text("UPDATE STUDENT_COURSE SET VERIFY='Y', VERIFY_BY=:by, VERIFY_AT=GETDATE() "
             "WHERE PK=:pk AND VERIFY IS NULL"),
        {"by": by, "pk": pk},
    )
    db.commit()
    return res.rowcount


def exam_dashboard(db: Session, session=None) -> dict:
    conds = [Enrollment.session == session] if session else []

    def count(*extra) -> int:
        return db.execute(
            select(func.count()).select_from(Enrollment).where(*conds, *extra)
        ).scalar() or 0

    filled = count(Enrollment.exam_form == "Yes")
    paid = count(Enrollment.form_status == "PAID")
    verified = count(Enrollment.verify == "Y")
    return {
        "session": session,
        "forms_filled": filled,
        "forms_paid": paid,
        "forms_verified": verified,
        "pending_verification": max(paid - verified, 0),
    }
