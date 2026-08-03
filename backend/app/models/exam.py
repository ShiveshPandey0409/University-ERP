"""ORM for EXAM_FORM (exam-form lines) and EXAM_MARKS (marks — denormalized)."""
from sqlalchemy import Column, DateTime, Integer, String

from app.db.session import Base


class ExamForm(Base):
    __tablename__ = "EXAM_FORM"

    id = Column("ID", Integer, primary_key=True)
    std_id = Column("STD_ID", Integer, index=True)      # -> STUDENT_COURSE.PK
    enroll_no = Column("ENROLL_NO", String(50))
    year = Column("YEAR", Integer)
    exam_month = Column("EXAM_MONTH", String(80))
    course_id = Column("COURSE_ID", String(20))
    semester = Column("SEMESTER", String(20))
    college_id = Column("COLLEGE_ID", String(20))
    sub_code = Column("SUB_CODE", String(20))
    paper_code = Column("PAPER_CODE", String(20))
    paper_type = Column("PAPER_TYPE", String(20))
    payment = Column("PAYMENT", String(20))
    txn_id = Column("TXN_ID", String(50))
    verification = Column("VERIFICATION", String(20))


class ExamMark(Base):
    __tablename__ = "EXAM_MARKS"

    id = Column("ID", Integer, primary_key=True)
    college_id = Column("COLLEGE_ID", String(10))
    college_name = Column("COLLEGE_NAME", String(255))
    course_id = Column("COURSE_ID", String(10), index=True)
    course_name = Column("COURSE_NAME", String(255))
    semester = Column("SEMESTER", String(10), index=True)
    enroll_no = Column("ENROLL_NO", String(20))
    rollno = Column("ROLLNO", String(20), index=True)
    name = Column("NAME", String(100))
    category = Column("CATEGORY", String(30))
    sub_code = Column("SUB_CODE", String(20))
    sub_name = Column("SUB_NAME", String(150))
    paper_code = Column("PAPER_CODE", String(30), index=True)
    paper_name = Column("PAPER_NAME", String(255))
    paper_type = Column("PAPER_TYPE", String(25), index=True)
    mm = Column("MM", String(50))
    pm = Column("PM", String(50))
    credit = Column("CREDIT", String(50))
    mark1 = Column("MARK1", String(10))
    mark2 = Column("MARK2", String(10))
    mrk_lock = Column("MRK_LOCK", String(10))
    lock = Column("LOCK", String(5))
