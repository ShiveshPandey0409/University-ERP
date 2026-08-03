"""ORM for the PtsnsuAdmission DB — ADMISSIONS (queried via get_adm_db engine)."""
from sqlalchemy import Column, Date, DateTime, Integer, Numeric, String

from app.db.session import Base


class Admission(Base):
    __tablename__ = "ADMISSIONS"

    id = Column("ID", Integer, primary_key=True)
    reg_no = Column("REG_NO", String(30), index=True)
    appl_no = Column("APPL_NO", String(30))
    student_name = Column("STUDENT_NAME", String(100))
    fname = Column("FNAME", String(100))
    gender = Column("GENDER", String(20))
    dob = Column("DOB", Date)
    category = Column("CATEGORY", String(20))
    ews = Column("EWS", String(10))
    domicile = Column("DOMICILE", String(20))
    mobile_no = Column("MOBILE_NO", String(15))
    email_id = Column("EMAIL_ID", String(100))
    session = Column("SESSION", String(20))
    adm_round = Column("AdmRound", String(20))
    course_id = Column("COURSE_ID", String(15))
    course_name = Column("COURSE_NAME", String(100))
    course_type = Column("COURSE_TYPE", String(30))
    faculty = Column("FACULTY", String(100))
    major = Column("MAJOR", String(100))
    q12_cgpa = Column("q12_cgpa", String(20))
    merit_cgpa = Column("MERIT_CGPA", Numeric(9, 3))
    pmt_status = Column("PMT_STATUS", String(20))
    adm_status = Column("ADM_STATUS", String(20))
    verify = Column("VERIFY", String(5))
    verify_by = Column("VERIFY_BY", String(50))
    verify_at = Column("VERIFY_AT", DateTime)
    admitted = Column("ADMITTED", String(5))
    ptsnsu_student = Column("PTSNSU_STUDENT", String(20))
