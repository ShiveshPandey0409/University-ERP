"""Admission (PreAdm/PostAdm) — runs against the PtsnsuAdmission DB (get_adm_db)."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import Principal, get_current_user, require_roles
from app.db.session import get_adm_db
from app.services import admission_service as svc

router = APIRouter(prefix="/admission", tags=["admission"])


@router.get("/dashboard")
def dashboard(session: str | None = Query(default=None), db: Session = Depends(get_adm_db),
              _: Principal = Depends(get_current_user)) -> dict:
    return svc.dashboard(db, session)


@router.get("/forms")
def forms(
    session: str | None = Query(default=None),
    round: str | None = Query(default=None),
    course_id: str | None = Query(default=None),
    status: str | None = Query(default=None, description="Verified | Pending"),
    db: Session = Depends(get_adm_db),
    _: Principal = Depends(get_current_user),
) -> list[dict]:
    return svc.list_forms(db, session=session, round=round, course_id=course_id, status=status)


@router.get("/merit")
def merit(session: str | None = Query(default=None), course_id: str | None = Query(default=None),
          db: Session = Depends(get_adm_db), _: Principal = Depends(get_current_user)) -> list[dict]:
    return svc.merit_list(db, session=session, course_id=course_id)


@router.get("/admitted")
def admitted(session: str | None = Query(default=None), course_id: str | None = Query(default=None),
             db: Session = Depends(get_adm_db), _: Principal = Depends(get_current_user)) -> list[dict]:
    return svc.admitted_list(db, session=session, course_id=course_id)


@router.get("/report/category-gender")
def report(session: str | None = Query(default=None), db: Session = Depends(get_adm_db),
           _: Principal = Depends(get_current_user)) -> list[dict]:
    return svc.category_gender_report(db, session)


@router.post("/forms/{reg_no}/verify")
def verify_form(reg_no: str, db: Session = Depends(get_adm_db),
                user: Principal = Depends(require_roles(7, 12, 13))):
    n = svc.verify(db, reg_no, user.uname)
    if n == 0:
        raise HTTPException(404, "Application not found or already verified")
    return {"verified": True, "reg_no": reg_no}
