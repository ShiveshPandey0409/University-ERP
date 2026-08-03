"""ORM for academic master data + enrollment (SESSIONS, COURSES, COLLEGES, CITY, STUDENT_COURSE)."""
from sqlalchemy import Column, DateTime, Identity, Integer, Numeric, String

from app.db.session import Base


class Session(Base):
    __tablename__ = "SESSIONS"

    id = Column("ID", Integer, Identity())
    session = Column("SESSION", String(25), primary_key=True)
    status = Column("STATUS", String(15))


class Course(Base):
    __tablename__ = "COURSES"

    id = Column("ID", Integer, Identity())
    course_type = Column("CourseType", String(20))
    faculty = Column("Faculty", String(100))
    course_id_num = Column("CourseID", Integer)
    course_name = Column("CourseName", String(100))
    major_id = Column("MajorID", Integer)
    major_subject = Column("Major_Subject", String(100))
    seats = Column("SEATS", Integer)
    course_id = Column("COURSE_ID", String(10), primary_key=True)
    status = Column("STATUS", String(40))
    scheme = Column("SCHEME", String(5))
    exam_mode = Column("EXAM_MODE", String(20))


class College(Base):
    __tablename__ = "COLLEGES"

    college_id = Column("COLLEGE_ID", String(255), primary_key=True)
    college_name = Column("COLLEGE_NAME", String(255))
    college_name_h = Column("COLLEGE_NAME_H", String(255))
    college_type = Column("COLLEGE_TYPE", String(50))
    student_type = Column("STUDENT_TYPE", String(50))
    city = Column("CITY", String(50))
    state = Column("STATE", String(50))
    principal_name = Column("PRINCIPAL_NAME", String(50))
    status = Column("STATUS", String(20))


class City(Base):
    __tablename__ = "CITY"

    id = Column("ID", Integer, primary_key=True, autoincrement=True)
    state = Column("State", String(255))
    city = Column("City", String(255))
    sort = Column("sort", Integer)


class Enrollment(Base):
    """STUDENT_COURSE — a student's enrollment in a course/semester/session."""
    __tablename__ = "STUDENT_COURSE"

    pk = Column("PK", Integer, primary_key=True, autoincrement=True)
    enroll_no = Column("EnrollNo", String(25), index=True)
    roll_no = Column("RollNo", String(25))
    college_id = Column("College_ID", String(15))
    session = Column("Session", String(15))
    year = Column("Year", Integer)
    course_id = Column("Course_ID", String(15))
    semester = Column("Semester", String(5))
    student_type = Column("StudentType", String(20))
    exam_type = Column("Examtype", String(20))
    status = Column("Status", String(20))
    acd_fee = Column("ACD_FEE", String(5))
    exam_form = Column("EXAM_FORM", String(5))
    form_status = Column("FORM_STATUS", String(50))
    exam_mnth = Column("EXAM_MNTH", String(50))
    rebate_acd = Column("REBATE_ACD", Numeric(18, 2))
    rebate_exm = Column("REBATE_EXM", Numeric(18, 2))
    verify = Column("VERIFY", String(2))
    center_id = Column("CENTER_ID", String(15))
    updat = Column("UPDAT", DateTime)
