"""Results — reimplemented from result_generate_mkst (RESULT_PUBLISHED) + RESULT_SGPA.

The legacy RESULT_PUBLISHED is one very wide row per student per semester with 20
paper blocks (P1..P20). We read it raw and un-pivot into a clean marksheet.
"""
from sqlalchemy import text
from sqlalchemy.orm import Session


def _paper(row, n: int) -> dict | None:
    code = row.get(f"P{n}_CODE")
    if not code:
        return None
    return {
        "code": code,
        "name": row.get(f"P{n}_NAME"),
        "type": row.get(f"P{n}_TYPE"),
        "max": row.get(f"P{n}_M"),
        "theory": row.get(f"P{n}_TH"),
        "practical": row.get(f"P{n}_PR"),
        "internal": row.get(f"P{n}_INT"),
        "total": row.get(f"P{n}_TOT"),
        "status": row.get(f"P{n}_ST"),
        "grade": row.get(f"P{n}_GRD"),
        "credit": row.get(f"P{n}_CREDIT"),
        "point": row.get(f"P{n}_POINT"),
    }


def _marksheet(row) -> dict:
    papers = [p for p in (_paper(row, n) for n in range(1, 21)) if p]
    return {
        "rollno": row.get("ROLLNO"),
        "enroll_no": row.get("ENROLL_NO"),
        "name": row.get("NAME"),
        "father_name": row.get("FNAME"),
        "course_id": row.get("COURSE_ID"),
        "course_name": row.get("COURSE_NAME"),
        "semester": row.get("SEM_NAME") or row.get("SEMESTER"),
        "college_name": row.get("COLLEGE_NAME"),
        "category": row.get("CATEGORY"),
        "exam_month": row.get("EXAM_MONTH"),
        "marksheet_no": row.get("MARKSHEET_NO"),
        "papers": papers,
        "sgpa": row.get("SGPA"),
        "result": row.get("RESULT"),
        "grand_cgpa": row.get("GRAND_CGPA"),
        "grand_percent": row.get("GRAND_PERCENT"),
        "grand_division": row.get("GRAND_DIVISION"),
        "grand_result": row.get("GRAND_RESULT"),
        "total": row.get("GND_TOT"),
        "max": row.get("GND_MAX"),
    }


def get_marksheets(db: Session, rollno: str) -> list[dict]:
    rows = db.execute(
        text("SELECT * FROM RESULT_PUBLISHED WITH(NOLOCK) WHERE ROLLNO=:r AND DISPLAY='YES'"),
        {"r": rollno},
    ).mappings().all()
    return [_marksheet(row) for row in rows]


def get_marksheets_by_enroll(db: Session, enroll: str) -> list[dict]:
    rows = db.execute(
        text("SELECT * FROM RESULT_PUBLISHED WITH(NOLOCK) WHERE ENROLL_NO=:e AND DISPLAY='YES'"),
        {"e": enroll},
    ).mappings().all()
    return [_marksheet(row) for row in rows]


def list_sgpa(db: Session, rollno: str) -> list[dict]:
    rows = db.execute(
        text("SELECT ENROLL_NO,ROLLNO,COURSE_ID,SEMESTER,CREDIT_TOT,CREDIT_OBT,SGPA,"
             "GND_MAX,GND_TOT,RESULT,EXAM_MONTH FROM RESULT_SGPA WITH(NOLOCK) "
             "WHERE ROLLNO=:r ORDER BY SEMESTER"),
        {"r": rollno},
    ).mappings().all()
    return [dict(r) for r in rows]
