"""Payments — reimplemented from payment_new / payment_list_uid / payment_update_exam."""
from decimal import Decimal

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.core.audit import now_ist
from app.models.academic import Enrollment
from app.models.payment import Payment


class NotFoundError(Exception):
    pass


def _d(v) -> Decimal:
    return Decimal(str(v or 0))


def _make_token(degree_id: str) -> str:
    # legacy: token = degreeId + ddhhmmss (IST)
    return f"{degree_id}{now_ist().strftime('%d%H%M%S')}"


def create_order(db: Session, *, enroll_no: str, degree_id: str, fee_for: str,
                 fee, latefee, portal_fee, discount, ip: str | None) -> Payment:
    token = _make_token(str(degree_id))
    fee_total = (_d(fee) + _d(portal_fee) + _d(latefee)) - _d(discount)
    p = Payment(
        token=token, enroll_no=enroll_no, degree_id=str(degree_id), fee_for=fee_for,
        fee=_d(fee), late_fee=_d(latefee), portal_fee=_d(portal_fee), discount=_d(discount),
        fee_total=fee_total, ip_address=(ip or "-")[:30], created=now_ist(),
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def list_payments(db: Session, enroll: str) -> list[Payment]:
    return list(
        db.execute(
            select(Payment).where(Payment.enroll_no == enroll).order_by(Payment.id.desc())
        ).scalars()
    )


def get_by_token(db: Session, token: str) -> Payment | None:
    return db.get(Payment, token)


def apply_exam_callback(db: Session, *, token: str, subpaisaid: str, status: str,
                        status_code: str, total_amt, discription: str) -> Payment:
    p = db.get(Payment, token)
    if p is None:
        raise NotFoundError("Unknown payment token")

    total = _d(total_amt)
    p.status = status
    p.transaction_no = subpaisaid
    p.total_amt = total
    p.bc = total - (p.fee_total or Decimal(0))
    p.resp_code = status_code
    p.discription = discription
    p.payment_date = now_ist()

    if (status or "").upper() == "SUCCESS":
        fee_for = (p.fee_for or "").lower()
        pk = p.degree_id
        enr = db.get(Enrollment, int(pk)) if pk and str(pk).isdigit() else None
        if "examination" in fee_for:
            db.execute(
                text("UPDATE EXAM_FORM SET PAYMENT='PAID', TXN_ID=:t WHERE STD_ID=:pk AND PAYMENT IS NULL"),
                {"t": token, "pk": pk},
            )
            if enr:
                enr.form_status = "PAID"
        elif "academic fees" in fee_for:
            if enr:
                enr.acd_fee = "Y"

    db.commit()
    return p
