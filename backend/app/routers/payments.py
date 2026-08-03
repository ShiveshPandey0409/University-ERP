"""Payment initiation + SabPaisa callback."""
from fastapi import APIRouter, Depends, Form, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import Principal, get_current_user
from app.db.session import get_db
from app.integrations import sabpaisa
from app.models.academic import Enrollment
from app.models.student import Student
from app.schemas.payments import PaymentInitiateRequest, PaymentRedirect

from app.services import payment_service

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/initiate", response_model=PaymentRedirect)
def initiate(
    body: PaymentInitiateRequest,
    request: Request,
    user: Principal = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.auth != "Student":
        raise HTTPException(403, "Only students can initiate a payment")
    enroll = user.uname
    enr = db.get(Enrollment, body.std_id)
    if enr is None or enr.enroll_no != enroll:
        raise HTTPException(404, "Enrollment not found for this student")
    student = db.get(Student, enroll)

    order = payment_service.create_order(
        db, enroll_no=enroll, degree_id=str(body.std_id), fee_for=body.fee_for,
        fee=body.fee, latefee=body.late_fee, portal_fee=settings.portal_fee, discount=body.discount,
        ip=request.client.host if request.client else None,
    )
    amount = float(order.fee_total or 0)
    redirect = sabpaisa.build_redirect(
        client_txn_id=order.token,
        amount=f"{amount:.2f}",
        payer_name=(student.name if student else enroll) or enroll,
        payer_email=(student.email if student else "") or "",
        payer_mobile=(student.mobile if student else "") or "",
        payer_address=enroll,
    )
    return PaymentRedirect(token=order.token, amount=amount, **redirect)


@router.post("/callback")
def callback(encResponse: str = Form(...), db: Session = Depends(get_db)):
    """SabPaisa posts back an encrypted response; decrypt, validate, update, redirect to the SPA."""
    data = sabpaisa.parse_response(encResponse)
    status = "SUCCESS" if data.get("statusCode") == "0000" else "FAILLED"
    try:
        payment_service.apply_exam_callback(
            db,
            token=data.get("clientTxnId", ""),
            subpaisaid=data.get("sabpaisaTxnId", ""),
            status=status,
            status_code=data.get("statusCode", ""),
            total_amt=data.get("amount", 0),
            discription=data.get("sabpaisaMessage", "")[:100],
        )
    except payment_service.NotFoundError as exc:
        raise HTTPException(404, str(exc))
    return RedirectResponse(url="http://localhost:5173/student/payments", status_code=303)
