"""Student self-service portal (auth='Student' accounts). uname == enrollment no."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import Principal, get_current_user
from app.db.session import get_db
from app.models.academic import Enrollment
from app.models.student import Student
from app.schemas.payments import ChangePasswordRequest, EnrollmentDetail, FeeOut, PaymentOut
from app.schemas.results import Marksheet
from app.schemas.students import StudentProfile
from app.services import auth_service, fee_service, payment_service, result_service, student_service

router = APIRouter(prefix="/student", tags=["student"])


def _enroll(user: Principal) -> str:
    if user.auth != "Student":
        raise HTTPException(403, "Student portal is for student accounts")
    return user.uname


@router.get("/me", response_model=StudentProfile)
def my_profile(user: Principal = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return student_service.get_student_profile(db, _enroll(user))
    except student_service.NotFoundError as exc:
        raise HTTPException(404, str(exc))


@router.get("/exam-forms", response_model=list[EnrollmentDetail])
def my_exam_forms(user: Principal = Depends(get_current_user), db: Session = Depends(get_db)):
    return student_service.list_enrollments(db, _enroll(user))


@router.get("/payments", response_model=list[PaymentOut])
def my_payments(user: Principal = Depends(get_current_user), db: Session = Depends(get_db)):
    return payment_service.list_payments(db, _enroll(user))


@router.post("/change-password", status_code=204)
def change_password(
    body: ChangePasswordRequest,
    user: Principal = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        auth_service.change_password(db, user.uname, body.old_password, body.new_password)
    except auth_service.AuthError as exc:
        raise HTTPException(400, exc.message)


@router.get("/result", response_model=list[Marksheet])
def my_result(user: Principal = Depends(get_current_user), db: Session = Depends(get_db)):
    return result_service.get_marksheets_by_enroll(db, _enroll(user))


@router.get("/fees/exam", response_model=FeeOut)
def exam_fee(std_id: int, user: Principal = Depends(get_current_user), db: Session = Depends(get_db)):
    enroll = _enroll(user)
    enr = db.get(Enrollment, std_id)
    if enr is None or enr.enroll_no != enroll:
        raise HTTPException(404, "Enrollment not found")
    student = db.get(Student, enroll)
    category = (student.category if student else None) or "UR"
    return fee_service.get_exam_fee(
        db, session=enr.session or "", course_id=enr.course_id, semester=enr.semester or "",
        category=category,
    )
