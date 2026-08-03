"""Students + academic master-data endpoints (any authenticated user)."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import Principal, get_current_user
from app.db.session import get_db
from app.schemas.students import (
    AcademicDashboard,
    CollegeOut,
    CourseOut,
    SessionOut,
    StudentListItem,
    StudentProfile,
)
from app.services import student_service as svc

router = APIRouter(tags=["academics"])


@router.get("/students", response_model=list[StudentListItem])
def list_students(
    search: str | None = Query(default=None),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: Principal = Depends(get_current_user),
):
    return svc.list_students(db, search, limit, offset)


@router.get("/students/{enroll}", response_model=StudentProfile)
def get_student(enroll: str, db: Session = Depends(get_db), _: Principal = Depends(get_current_user)):
    try:
        return svc.get_student_profile(db, enroll)
    except svc.NotFoundError as exc:
        raise HTTPException(404, str(exc))


@router.get("/academic/sessions", response_model=list[SessionOut])
def sessions(db: Session = Depends(get_db), _: Principal = Depends(get_current_user)):
    return svc.list_sessions(db)


@router.get("/academic/courses", response_model=list[CourseOut])
def courses(db: Session = Depends(get_db), _: Principal = Depends(get_current_user)):
    return svc.list_courses(db)


@router.get("/academic/colleges", response_model=list[CollegeOut])
def colleges(db: Session = Depends(get_db), _: Principal = Depends(get_current_user)):
    return svc.list_colleges(db)


@router.get("/academic/dashboard", response_model=AcademicDashboard)
def dashboard(
    session: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: Principal = Depends(get_current_user),
):
    return svc.academic_dashboard(db, session)
