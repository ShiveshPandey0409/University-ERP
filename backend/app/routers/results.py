"""Results — marksheet + SGPA lookup + PDF (any authenticated user)."""
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.deps import Principal, get_current_user
from app.db.session import get_db
from app.integrations.pdf import marksheet_pdf
from app.schemas.results import Marksheet
from app.services import result_service

router = APIRouter(prefix="/results", tags=["results"])


@router.get("/{rollno}", response_model=list[Marksheet])
def marksheets(rollno: str, db: Session = Depends(get_db), _: Principal = Depends(get_current_user)):
    return result_service.get_marksheets(db, rollno)


@router.get("/{rollno}/sgpa")
def sgpa(rollno: str, db: Session = Depends(get_db), _: Principal = Depends(get_current_user)) -> list[dict]:
    return result_service.list_sgpa(db, rollno)


@router.get("/{rollno}/pdf")
def marksheet_pdf_download(rollno: str, db: Session = Depends(get_db),
                          _: Principal = Depends(get_current_user)):
    sheets = result_service.get_marksheets(db, rollno)
    if not sheets:
        raise HTTPException(404, "No published result for this roll number")
    pdf = marksheet_pdf(sheets)
    return StreamingResponse(
        BytesIO(pdf), media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="marksheet_{rollno}.pdf"'},
    )
