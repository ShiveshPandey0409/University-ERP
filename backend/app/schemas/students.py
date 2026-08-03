"""Schemas for students + academic master data."""
from datetime import date

from pydantic import BaseModel


class StudentListItem(BaseModel):
    enroll_no: str
    name: str | None = None
    father_name: str | None = None
    category: str | None = None
    gender: str | None = None
    mobile: str | None = None
    email: str | None = None


class EnrollmentOut(BaseModel):
    session: str | None = None
    course_id: str | None = None
    course_name: str | None = None
    semester: str | None = None
    roll_no: str | None = None
    student_type: str | None = None
    status: str | None = None
    form_status: str | None = None


class StudentProfile(BaseModel):
    enroll_no: str
    name: str | None = None
    name_hindi: str | None = None
    father_name: str | None = None
    mother_name: str | None = None
    gender: str | None = None
    dob: date | None = None
    category: str | None = None
    ews: str | None = None
    mobile: str | None = None
    email: str | None = None
    address1: str | None = None
    city1: str | None = None
    state1: str | None = None
    photo_url: str | None = None
    sign_url: str | None = None
    prof_status: str | None = None
    enrollments: list[EnrollmentOut] = []


class SessionOut(BaseModel):
    session: str
    status: str | None = None


class CourseOut(BaseModel):
    course_id: str
    course_name: str | None = None
    course_type: str | None = None
    faculty: str | None = None
    scheme: str | None = None
    status: str | None = None


class CollegeOut(BaseModel):
    college_id: str
    college_name: str | None = None
    college_type: str | None = None
    city: str | None = None
    status: str | None = None


class AcademicDashboard(BaseModel):
    session: str | None = None
    total_enrollments: int
    active_enrollments: int
    exam_forms_paid: int
