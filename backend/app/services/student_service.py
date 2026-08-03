"""Student + academic read logic (reimplements student_profile, acad lists/dashboards)."""
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.academic import College, Course, Enrollment
from app.models.academic import Session as AcadSession
from app.models.student import Student


class NotFoundError(Exception):
    pass


def _photo_url(filename: str | None) -> str | None:
    if not filename:
        return None
    return f"{settings.uploads_base}UsersPhoto/{filename}"


def list_students(db: Session, search: str | None, limit: int, offset: int) -> list[Student]:
    stmt = select(Student)
    if search:
        like = f"%{search.strip()}%"
        stmt = stmt.where(or_(Student.enroll_no.like(like), Student.name.like(like)))
    stmt = stmt.order_by(Student.enroll_no).offset(offset).limit(limit)
    return list(db.execute(stmt).scalars())


def get_student_profile(db: Session, enroll: str) -> dict:
    s = db.get(Student, enroll)
    if s is None:
        raise NotFoundError("Student not found")

    course_names = {
        c.course_id: c.course_name for c in db.execute(select(Course)).scalars()
    }
    enrs = db.execute(
        select(Enrollment).where(Enrollment.enroll_no == enroll).order_by(Enrollment.year, Enrollment.semester)
    ).scalars()

    return {
        "enroll_no": s.enroll_no,
        "name": s.name,
        "name_hindi": s.name_hindi,
        "father_name": s.father_name,
        "mother_name": s.mother_name,
        "gender": s.gender,
        "dob": s.dob,
        "category": s.category,
        "ews": s.ews,
        "mobile": s.mobile,
        "email": s.email,
        "address1": s.address1,
        "city1": s.city1,
        "state1": s.state1,
        "photo_url": _photo_url(s.photo_img),
        "sign_url": _photo_url(s.sign_img),
        "prof_status": s.prof_status,
        "enrollments": [
            {
                "session": e.session,
                "course_id": e.course_id,
                "course_name": course_names.get(e.course_id),
                "semester": e.semester,
                "roll_no": e.roll_no,
                "student_type": e.student_type,
                "status": e.status,
                "form_status": e.form_status,
            }
            for e in enrs
        ],
    }


def list_enrollments(db: Session, enroll: str) -> list[dict]:
    course_names = {c.course_id: c.course_name for c in db.execute(select(Course)).scalars()}
    rows = db.execute(
        select(Enrollment).where(Enrollment.enroll_no == enroll).order_by(Enrollment.year, Enrollment.semester)
    ).scalars()
    return [
        {
            "pk": e.pk,
            "session": e.session,
            "course_id": e.course_id,
            "course_name": course_names.get(e.course_id),
            "semester": e.semester,
            "roll_no": e.roll_no,
            "status": e.status,
            "acd_fee": e.acd_fee,
            "exam_form": e.exam_form,
            "form_status": e.form_status,
        }
        for e in rows
    ]


def list_sessions(db: Session) -> list[AcadSession]:
    return list(db.execute(select(AcadSession).order_by(AcadSession.session.desc())).scalars())


def list_courses(db: Session) -> list[Course]:
    return list(db.execute(select(Course).order_by(Course.course_name)).scalars())


def list_colleges(db: Session) -> list[College]:
    return list(db.execute(select(College).order_by(College.college_name)).scalars())


def academic_dashboard(db: Session, session: str | None) -> dict:
    conds = [Enrollment.session == session] if session else []

    def count(*extra) -> int:
        return db.execute(
            select(func.count()).select_from(Enrollment).where(*conds, *extra)
        ).scalar() or 0

    total = count()
    active = count(Enrollment.status == "Active")
    paid = count(Enrollment.form_status == "PAID")
    return {
        "session": session,
        "total_enrollments": total,
        "active_enrollments": active,
        "exam_forms_paid": paid,
    }
