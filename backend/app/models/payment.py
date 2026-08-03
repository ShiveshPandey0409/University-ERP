"""ORM for PAYMENTS (gateway transactions) and FEES_MASTER (fee schedule)."""
from sqlalchemy import Column, DateTime, Identity, Integer, Numeric, String

from app.db.session import Base


class Payment(Base):
    __tablename__ = "PAYMENTS"

    id = Column("ID", Integer, Identity())
    token = Column("TOKEN", String(50), primary_key=True)
    enroll_no = Column("ENROLL_NO", String(15), index=True)
    degree_id = Column("DEGREE_ID", String(30))     # holds STUDENT_COURSE.PK for exam/academic fees
    fee_for = Column("FEE_FOR", String(150))
    fee = Column("FEE", Numeric(10, 2))
    late_fee = Column("LATE_FEE", Numeric(10, 2))
    portal_fee = Column("PORTAL_FEE", Numeric(18, 2))
    discount = Column("DISCOUNT", Numeric(18, 2))
    fee_total = Column("FEE_TOTAL", Numeric(18, 2))
    bc = Column("BC", Numeric(10, 2))
    total_amt = Column("TOTAL_AMT", Numeric(10, 2))
    transaction_no = Column("TRANSACTION_NO", String(40))
    status = Column("STATUS", String(20))
    resp_code = Column("RESP_CODE", String(10))
    discription = Column("DISCRIPTION", String(100))
    payment_date = Column("PAYMENT_DATE", DateTime)
    ip_address = Column("IP_ADDRESS", String(30))
    created = Column("CREATED", DateTime)
    rft = Column("RFT", String(20))


class FeeMaster(Base):
    """FEES_MASTER — fee schedule keyed on (SESSION, COURSE_ID, SEMESTER, CATEGORY, FEE_TYPE)."""
    __tablename__ = "FEES_MASTER"

    id = Column("ID", Integer, Identity())
    session = Column("SESSION", String(20), primary_key=True)
    course_id = Column("COURSE_ID", Integer, primary_key=True)
    semester = Column("SEMESTER", String(3), primary_key=True)
    category = Column("CATEGORY", String(20), primary_key=True)
    fee_type = Column("FEE_TYPE", String(25), primary_key=True)
    fee_amt = Column("FEE_AMT", Numeric(18, 2))
    late_fee = Column("LATE_FEE", Numeric(18, 2))
