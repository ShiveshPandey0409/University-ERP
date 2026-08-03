"""Admission (PreAdm/PostAdm) — reimplemented from admission_form_* / adm_* /
admission_dashboard_count / merit-list procs. Runs against the PtsnsuAdmission DB."""
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.core.audit import now_ist
from app.models.admission import Admission


class NotFoundError(Exception):
    pass


def _row(a: Admission) -> dict:
    return {
        "reg_no": a.reg_no, "appl_no": a.appl_no, "student_name": a.student_name,
        "fname": a.fname, "gender": a.gender, "category": a.category, "ews": a.ews,
        "session": a.session, "round": a.adm_round, "course_id": a.course_id,
        "course_name": a.course_name, "course_type": a.course_type, "major": a.major,
        "merit_cgpa": float(a.merit_cgpa) if a.merit_cgpa is not None else None,
        "pmt_status": a.pmt_status, "verify": a.verify, "admitted": a.admitted,
    }


def dashboard(db: Session, session=None) -> dict:
    conds = [Admission.session == session] if session else []

    def c(*extra):
        return db.execute(select(func.count()).select_from(Admission).where(*conds, *extra)).scalar() or 0

    return {
        "received": c(),
        "verified": c(Admission.verify == "Y"),
        "pending": c(Admission.verify.is_(None)),
        "admitted": c(Admission.admitted == "Y"),
    }


def list_forms(db: Session, *, session=None, round=None, course_id=None, status=None, limit=300) -> list[dict]:
    stmt = select(Admission)
    conds = []
    if session:
        conds.append(Admission.session == session)
    if round:
        conds.append(Admission.adm_round == round)
    if course_id:
        conds.append(Admission.course_id == course_id)
    if status == "Verified":
        conds.append(Admission.verify == "Y")
    elif status == "Pending":
        conds.append(Admission.verify.is_(None))
    if conds:
        stmt = stmt.where(*conds)
    return [_row(a) for a in db.execute(stmt.order_by(Admission.reg_no).limit(limit)).scalars()]


def merit_list(db: Session, *, session=None, course_id=None, limit=500) -> list[dict]:
    stmt = select(Admission).where(Admission.verify == "Y", Admission.merit_cgpa.isnot(None))
    if session:
        stmt = stmt.where(Admission.session == session)
    if course_id:
        stmt = stmt.where(Admission.course_id == course_id)
    rows = db.execute(stmt.order_by(Admission.merit_cgpa.desc(), Admission.reg_no).limit(limit)).scalars()
    return [{"rank": i + 1, **_row(a)} for i, a in enumerate(rows)]


def admitted_list(db: Session, *, session=None, course_id=None, limit=300) -> list[dict]:
    stmt = select(Admission).where(Admission.admitted == "Y")
    if session:
        stmt = stmt.where(Admission.session == session)
    if course_id:
        stmt = stmt.where(Admission.course_id == course_id)
    return [_row(a) for a in db.execute(stmt.order_by(Admission.reg_no).limit(limit)).scalars()]


def verify(db: Session, reg_no: str, by: str) -> int:
    """Reimpl admission_form_verification (idempotent on VERIFY IS NULL)."""
    res = db.execute(
        text("UPDATE ADMISSIONS SET VERIFY='Y', VERIFY_BY=:by, VERIFY_AT=:at WHERE REG_NO=:r AND VERIFY IS NULL"),
        {"by": by, "at": now_ist(), "r": reg_no},
    )
    db.commit()
    return res.rowcount


def category_gender_report(db: Session, session=None) -> list[dict]:
    """Reimpl rpt1_cat_mf_count: category x gender counts."""
    stmt = select(Admission.category, Admission.gender, func.count().label("n"))
    if session:
        stmt = stmt.where(Admission.session == session)
    stmt = stmt.group_by(Admission.category, Admission.gender)

    agg: dict[str, dict] = {}
    for cat, gender, n in db.execute(stmt).all():
        row = agg.setdefault(cat or "—", {"category": cat or "—", "male": 0, "female": 0, "total": 0})
        if (gender or "").lower().startswith("m"):
            row["male"] += n
        elif (gender or "").lower().startswith("f"):
            row["female"] += n
        row["total"] += n
    return sorted(agg.values(), key=lambda r: r["category"])
