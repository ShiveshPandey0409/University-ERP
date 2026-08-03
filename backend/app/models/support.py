"""ORM for COMPLAINT, COMPLAINT_CATEG, NOTICEBOARD, DEGREE_DATA."""
from sqlalchemy import Column, DateTime, Integer, String

from app.db.session import Base


class Complaint(Base):
    __tablename__ = "COMPLAINT"

    id = Column("ID", Integer, primary_key=True, autoincrement=True)
    enroll_no = Column("ENROLL_NO", String(20), index=True)
    details = Column("DETAILS", String)
    crat = Column("CRAT", DateTime)
    crby = Column("CRBY", String(30))
    status = Column("STATUS", String(30))
    updby = Column("UPDBY", String(30))
    updat = Column("UPDAT", DateTime)
    flname = Column("FLNAME", String(80))
    assign = Column("ASSIGN", String(50))
    category = Column("CATEGORY", String(200))


class ComplaintCateg(Base):
    __tablename__ = "COMPLAINT_CATEG"

    id = Column("ID", Integer, primary_key=True, autoincrement=True)
    categ = Column("CATEG", String(200))
    status = Column("STATUS", String(20))
    sort = Column("SORT", Integer)


class Notice(Base):
    __tablename__ = "NOTICEBOARD"

    id = Column("ID", Integer, primary_key=True, autoincrement=True)
    details = Column("DETAILS", String)


class Degree(Base):
    __tablename__ = "DEGREE_DATA"

    id = Column("ID", Integer, primary_key=True)
    ugpg = Column("UGPG", String)
    course = Column("COURSE", String)
    subject = Column("SUBJECT", String)
    enroll_no = Column("ENROLL_NO", String(30), index=True)
    rollno = Column("ROLLNO", String(30))
    name = Column("NAME", String(100))
    fname = Column("FNAME", String(100))
    degree_year = Column("DEGREE_YEAR", String(20))
    degree_type = Column("DEGREE_TYPE", String(50))
    division = Column("DIVISION", String(30))
    register = Column("REGISTER", String(20))
    status = Column("STATUS", String(20))
    verified = Column("VERIFIED", String(20))
    delivered = Column("DELIVERED", String(20))
    cert_no = Column("CERT_NO", String(30))
    txn_id = Column("TXN_ID", String(50))
