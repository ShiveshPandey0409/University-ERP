"""Grievance — categories/status/list/update (staff) + register (student)."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import Principal, get_current_user
from app.db.session import get_db
from app.schemas.support import (
    ComplaintCategOut,
    ComplaintOut,
    ComplaintRegisterRequest,
    ComplaintStatus,
    ComplaintUpdateRequest,
)
from app.services import grievance_service as svc

router = APIRouter(prefix="/grievance", tags=["grievance"])


@router.get("/categories", response_model=list[ComplaintCategOut])
def categories(db: Session = Depends(get_db), _: Principal = Depends(get_current_user)):
    return svc.categories(db)


@router.get("/status", response_model=ComplaintStatus)
def status(db: Session = Depends(get_db), _: Principal = Depends(get_current_user)):
    return svc.status_counts(db)


@router.get("/complaints", response_model=list[ComplaintOut])
def complaints(
    status: str | None = Query(default=None, description="Open | Closed | Replied"),
    category: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: Principal = Depends(get_current_user),
):
    return svc.list_admin(db, status=status, category=category)


@router.post("/complaints")
def register(body: ComplaintRegisterRequest, user: Principal = Depends(get_current_user),
             db: Session = Depends(get_db)):
    cid = svc.register(db, enroll_no=user.uname, category=body.category,
                       remarks=body.remarks, file_name=body.file_name, crby=user.uname)
    if cid == 0:
        raise HTTPException(400, "You already have 2 open complaints.")
    return {"complaint_id": cid}


@router.put("/complaints/{complaint_id}", response_model=ComplaintOut)
def update(complaint_id: int, body: ComplaintUpdateRequest,
           user: Principal = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return svc.update(db, complaint_id=complaint_id, remarks=body.remarks,
                          status=body.status, assign=body.assign, by=user.uname)
    except svc.NotFoundError as exc:
        raise HTTPException(404, str(exc))
