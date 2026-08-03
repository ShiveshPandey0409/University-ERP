"""Schemas for student self-service, fees, and payments."""
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(min_length=1)
    new_password: str = Field(min_length=4, max_length=50)


class EnrollmentDetail(BaseModel):
    pk: int
    session: str | None = None
    course_id: str | None = None
    course_name: str | None = None
    semester: str | None = None
    roll_no: str | None = None
    status: str | None = None
    acd_fee: str | None = None
    exam_form: str | None = None
    form_status: str | None = None


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    token: str
    enroll_no: str | None = None
    fee_for: str | None = None
    fee: Decimal | None = None
    late_fee: Decimal | None = None
    portal_fee: Decimal | None = None
    discount: Decimal | None = None
    fee_total: Decimal | None = None
    total_amt: Decimal | None = None
    transaction_no: str | None = None
    status: str | None = None
    payment_date: datetime | None = None
    created: datetime | None = None


class FeeOut(BaseModel):
    fee: float
    late_fee: float


class PaymentInitiateRequest(BaseModel):
    std_id: int                 # STUDENT_COURSE.PK
    fee_for: str                # e.g. "Examination Fees" / "Academic Fees"
    fee: float
    late_fee: float = 0.0
    discount: float = 0.0


class PaymentRedirect(BaseModel):
    token: str
    url: str
    encData: str
    clientCode: str
    amount: float
