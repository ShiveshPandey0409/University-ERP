"""Notices, Degree, and Fees back-office endpoints."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import Principal, get_current_user
from app.db.session import get_db
from app.schemas.support import DegreeDashboard, NoticeOut, NoticeUpdateRequest
from app.services import degree_service, fee_service, notice_service

# ---- Notices ----
notices = APIRouter(prefix="/notices", tags=["notices"])


@notices.get("", response_model=NoticeOut)
def get_notice(db: Session = Depends(get_db), _: Principal = Depends(get_current_user)):
    return notice_service.get(db, 1)


@notices.put("", response_model=NoticeOut)
def update_notice(body: NoticeUpdateRequest, db: Session = Depends(get_db),
                  _: Principal = Depends(get_current_user)):
    return notice_service.update(db, 1, body.details)


# ---- Degree ----
degree = APIRouter(prefix="/degree", tags=["degree"])


@degree.get("/dashboard", response_model=DegreeDashboard)
def degree_dashboard(db: Session = Depends(get_db), _: Principal = Depends(get_current_user)):
    return degree_service.dashboard(db)


@degree.get("/list")
def degree_list(status: str | None = Query(default=None), search: str | None = Query(default=None),
                db: Session = Depends(get_db), _: Principal = Depends(get_current_user)) -> list[dict]:
    return degree_service.list_degrees(db, status=status, search=search)


# ---- Fees back-office ----
fees = APIRouter(prefix="/fees", tags=["fees"])


@fees.get("/dashboard")
def fees_dashboard(db: Session = Depends(get_db), _: Principal = Depends(get_current_user)) -> dict:
    return fee_service.fees_dashboard(db)


@fees.get("/collection")
def fees_collection(date_from: str, date_to: str, rollno: str | None = Query(default=None),
                    db: Session = Depends(get_db), _: Principal = Depends(get_current_user)) -> list[dict]:
    return fee_service.collection_report(db, date_from=date_from, date_to=date_to, rollno=rollno)
