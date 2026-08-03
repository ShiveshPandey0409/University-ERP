"""Fee lookups + back-office reporting — reimplemented from fee_get_adm / fee_exam_get,
fees_report_list, fees_dashboard_count."""
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.audit import now_ist
from app.models.payment import FeeMaster, Payment
from app.models.student import Student

# multi-semester fee rules from fee_get_adm (@multi = Y/O, @semester = II/IV)
_MULTI_SEMS = {
    ("Y", "II"): ["I", "II"],
    ("Y", "IV"): None,            # all semesters
    ("O", "II"): ["I", "II"],
    ("O", "IV"): ["III", "IV"],
}


def _to_int(course_id: str) -> int | None:
    try:
        return int(str(course_id).strip())
    except (TypeError, ValueError):
        return None


def get_fee(db: Session, *, session: str, course_id, semester: str,
            category: str, fee_type: str, multi: str = "N") -> dict:
    """Return {fee, late_fee}. `multi` Y/O sums across the relevant semesters (fee_get_adm)."""
    cid = _to_int(course_id)
    base = [FeeMaster.course_id == cid, FeeMaster.category == category, FeeMaster.fee_type == fee_type]
    if session:
        base.append(FeeMaster.session == session)

    sems = _MULTI_SEMS.get((multi, semester), ...) if multi in ("Y", "O") else None
    if multi in ("Y", "O"):
        conds = list(base)
        if sems:  # specific semesters; None = all
            conds.append(FeeMaster.semester.in_(sems))
        total = db.execute(select(func.sum(FeeMaster.fee_amt)).where(*conds)).scalar()
        return {"fee": float(total or 0), "late_fee": 0.0}

    row = db.execute(
        select(FeeMaster.fee_amt, FeeMaster.late_fee).where(*base, FeeMaster.semester == semester)
    ).first()
    return {
        "fee": float(row[0]) if row and row[0] is not None else 0.0,
        "late_fee": float(row[1]) if row and row[1] is not None else 0.0,
    }


def get_exam_fee(db: Session, *, session: str, course_id, semester: str, category: str) -> dict:
    return get_fee(db, session=session, course_id=course_id, semester=semester,
                   category=category, fee_type="Exam")


def get_academic_fee(db: Session, *, session: str, course_id, semester: str, category: str,
                     multi: str = "N") -> dict:
    return get_fee(db, session=session, course_id=course_id, semester=semester,
                   category=category, fee_type="Admission", multi=multi)


# ---- back-office reporting ----
def collection_report(db: Session, *, date_from: str, date_to: str, rollno=None, limit=2000) -> list[dict]:
    """Successful collections in a date range (reimpl fees_report_list, main DB only)."""
    try:
        d0 = datetime.strptime(date_from, "%Y-%m-%d")
        d1 = datetime.strptime(date_to, "%Y-%m-%d") + timedelta(days=1)
    except ValueError:
        return []
    stmt = (
        select(Payment, Student.name, Student.mobile)
        .outerjoin(Student, Student.enroll_no == Payment.enroll_no)
        .where(Payment.status == "SUCCESS", Payment.payment_date >= d0, Payment.payment_date < d1)
    )
    if rollno and rollno != "0":
        stmt = stmt.where(Payment.enroll_no == rollno)
    stmt = stmt.order_by(Payment.payment_date.desc()).limit(limit)

    out = []
    for p, name, mobile in db.execute(stmt).all():
        out.append({
            "enroll_no": p.enroll_no, "order_id": p.token, "fee_for": p.fee_for,
            "amount": float((p.fee_total or 0) - (p.portal_fee or 0)),
            "transaction_no": p.transaction_no, "pay_date": p.payment_date,
            "student_name": name, "mobile": mobile,
        })
    return out


def fees_dashboard(db: Session) -> dict:
    def stats(day):
        d0 = datetime(day.year, day.month, day.day)
        d1 = d0 + timedelta(days=1)
        row = db.execute(
            select(
                func.count(),
                func.coalesce(func.sum(Payment.fee_total - Payment.portal_fee), 0),
            ).where(Payment.status == "SUCCESS", Payment.payment_date >= d0, Payment.payment_date < d1)
        ).one()
        return {"count": int(row[0] or 0), "amount": float(row[1] or 0)}

    today = now_ist().date()
    return {"today": stats(today), "yesterday": stats(today - timedelta(days=1))}
