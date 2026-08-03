"""Schemas for exam operations + marks (Emarks)."""
from pydantic import BaseModel


class ExamFormItem(BaseModel):
    pk: int
    enroll_no: str | None = None
    name: str | None = None
    roll_no: str | None = None
    session: str | None = None
    course_id: str | None = None
    semester: str | None = None
    exam_form: str | None = None
    form_status: str | None = None
    verify: str | None = None


class ExamDashboard(BaseModel):
    session: str | None = None
    forms_filled: int
    forms_paid: int
    forms_verified: int
    pending_verification: int


class EntryStatusItem(BaseModel):
    course_id: str | None = None
    course_name: str | None = None
    semester: str | None = None
    students: int
    theory: float
    practical: float
    internal: float
    total: float


class PaperItem(BaseModel):
    paper_code: str | None = None
    paper_type: str | None = None
    paper_name: str | None = None
    mm: str | None = None
    pm: str | None = None
    total: int
    entered: int


class MarkRow(BaseModel):
    id: int
    rollno: str | None = None
    enroll_no: str | None = None
    name: str | None = None
    mm: str | None = None
    pm: str | None = None
    mark1: str | None = None
    mark2: str | None = None
    locked: bool


class MarkUpdateRequest(BaseModel):
    marks: str
