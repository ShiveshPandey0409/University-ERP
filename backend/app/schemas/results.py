"""Schemas for results / marksheet."""
from pydantic import BaseModel


class MarksheetPaper(BaseModel):
    code: str | None = None
    name: str | None = None
    type: str | None = None
    max: str | None = None
    theory: str | None = None
    practical: str | None = None
    internal: str | None = None
    total: str | None = None
    status: str | None = None
    grade: str | None = None
    credit: str | None = None
    point: str | None = None


class Marksheet(BaseModel):
    rollno: str | None = None
    enroll_no: str | None = None
    name: str | None = None
    father_name: str | None = None
    course_id: str | None = None
    course_name: str | None = None
    semester: str | None = None
    college_name: str | None = None
    category: str | None = None
    exam_month: str | None = None
    marksheet_no: str | None = None
    papers: list[MarksheetPaper] = []
    sgpa: str | None = None
    result: str | None = None
    grand_cgpa: str | None = None
    grand_percent: str | None = None
    grand_division: str | None = None
    grand_result: str | None = None
    total: str | None = None
    max: str | None = None
