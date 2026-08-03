"""ORM for the student master (STUDENTS). PK = EnrollNo."""
from sqlalchemy import Column, Date, DateTime, Identity, Integer, String

from app.db.session import Base


class Student(Base):
    __tablename__ = "STUDENTS"

    id = Column("ID", Integer, Identity())
    enroll_no = Column("EnrollNo", String(20), primary_key=True)
    suin = Column("SUIN", String(20))
    abcid = Column("ABCID", String(20))
    name = Column("StudentName", String(100))
    name_hindi = Column("StudentName_HINDI", String(100))
    father_name = Column("Fathername", String(100))
    mother_name = Column("MotherName", String(100))
    aadhar_no = Column("AadharNo", String(20))
    gender = Column("Gender", String(20))
    dob = Column("DOB", Date)
    category = Column("Category", String(20))
    ews = Column("EWS", String(50))
    religion = Column("RELIGION", String(50))
    pwd = Column("PWD", String(50))
    mp_domicile = Column("MPDomecile", String(20))
    address1 = Column("ADDRESS1", String(150))
    state1 = Column("STATE1", String(50))
    city1 = Column("CITY1", String(50))
    pincode1 = Column("PINCODE1", String(50))
    mobile = Column("MobileNumber", String(20))
    email = Column("EmailID", String(100))
    father_mobile = Column("F_Mobile", String(10))
    photo_img = Column("PHOTO_IMG", String(50))
    sign_img = Column("SIGN_IMG", String(50))
    prof_status = Column("PROF_STATUS", String(50))
    photo_status = Column("PHOTO_STATUS", String(50))
    upd_dt = Column("UPD_DT", DateTime)
    inst = Column("INST", String(50))
