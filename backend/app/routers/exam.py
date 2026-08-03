"""Exam operations (Univ/College exam section). Reads: any authenticated; verify: role 12."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import Principal, get_current_user, require_roles
from app.db.session import get_db
from app.schemas.exam import ExamDashboard, ExamFormItem
from app.services import exam_service

router = APIRouter(prefix="/exam", tags=["exam"])


@router.get("/dashboard", response_model=ExamDashboard)
def dashboard(session: str | None = Query(default=None), db: Session = Depends(get_db),
              _: Principal = Depends(get_current_user)):
    return exam_service.exam_dashboard(db, session)


@router.get("/forms", response_model=list[ExamFormItem])
def forms(
    session: str | None = Query(default=None),
    course_id: str | None = Query(default=None),
    semester: str | None = Query(default=None),
    verify: str | None = Query(default=None, description="Y (verified) or N (pending)"),
    db: Session = Depends(get_db),
    _: Principal = Depends(get_current_user),
):
    return exam_service.list_forms(db, session=session, course_id=course_id, semester=semester, verify=verify)


@router.post("/forms/{pk}/verify")
def verify(pk: int, db: Session = Depends(get_db), user: Principal = Depends(require_roles(12))):
    updated = exam_service.verify_form(db, pk, user.uname)
    if updated == 0:
        raise HTTPException(404, "Form not found or already verified")
    return {"verified": True, "pk": pk}
