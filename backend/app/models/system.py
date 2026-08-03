"""ORM models mapped onto the EXISTING system/auth tables (no schema changes).

Column names preserve the legacy casing; attribute names are pythonic.
"""
from sqlalchemy import Boolean, Column, DateTime, Identity, Integer, String

from app.db.session import Base


class User(Base):
    """USERS — operational logins (students, colleges, admins). No PK in DB; ID is identity."""
    __tablename__ = "USERS"

    id = Column("ID", Integer, primary_key=True, autoincrement=True)
    uname = Column("UNAME", String(50), index=True)
    password = Column("PASSWORD", String(50))          # plaintext legacy -> bcrypt-on-login
    college_id = Column("COLLEGE_ID", String(10))
    auth = Column("AUTH", String(50))                  # Student | College | Univ | Emarks | FrmVerify
    status = Column("STATUS", String(10))
    upat = Column("UPAT", DateTime)


class UserAdmin(Base):
    """USERSADMIN — admin profile (name/mobile/email/OTP). PK = UNAME."""
    __tablename__ = "USERSADMIN"

    id = Column("ID", Integer, Identity())
    uname = Column("UNAME", String(50), primary_key=True)
    name = Column("NAME", String(50))
    fname = Column("FNAME", String(50))
    mobile = Column("MOBILE", String(50))
    aadhar = Column("AADHAR", String(50))
    email = Column("EMAIL", String(50))
    address = Column("ADDRESS", String(150))
    photo = Column("PHOTO", String(50))
    otp = Column("OTP", String(5))
    otp_code = Column("OTP_CODE", String(5))
    otp_date = Column("OTP_DATE", DateTime)
    status = Column("STATUS", String(50))
    upby = Column("UPBY", String(50))
    upat = Column("UPAT", DateTime)


class UserRole(Base):
    """UROLLS — user -> role grants. PK (UID, UROLL); ID is identity."""
    __tablename__ = "UROLLS"

    id = Column("ID", Integer, primary_key=True, autoincrement=True)
    uid = Column("UID", String(50), index=True)
    uroll = Column("UROLL", Integer)


class SysRole(Base):
    """SYSROLL — role catalog. PK = ID."""
    __tablename__ = "SYSROLL"

    id = Column("ID", Integer, primary_key=True, autoincrement=True)
    categ = Column("CATEG", String(30))
    roll_name = Column("ROLL_NAME", String(50))
    updby = Column("UPDBY", String(50))
    updat = Column("UPDAT", DateTime)


class MenuItem(Base):
    """MENU_ITEMS — navigation tree. PK = ID."""
    __tablename__ = "MENU_ITEMS"

    id = Column("ID", Integer, primary_key=True, autoincrement=True)
    parent_id = Column("PARENT_ID", Integer)
    menu_text = Column("MENU_TEXT", String(100))
    menu_url = Column("MENU_URL", String(200))
    menu_icon = Column("MENU_ICON", String(50))
    menu_section = Column("MENU_SECTION", String(50))
    display_order = Column("DISPLAY_ORDER", Integer)
    is_active = Column("IS_ACTIVE", Boolean)
    created_by = Column("CREATED_BY", String(50))
    created_at = Column("CREATED_AT", DateTime)
    modified_by = Column("MODIFIED_BY", String(50))
    modified_at = Column("MODIFIED_AT", DateTime)


class MenuRoleMapping(Base):
    """MENU_ROLE_MAPPING — menu <-> role visibility. PK = ID."""
    __tablename__ = "MENU_ROLE_MAPPING"

    id = Column("ID", Integer, primary_key=True, autoincrement=True)
    menu_id = Column("MENU_ID", Integer, index=True)
    role_id = Column("ROLE_ID", Integer, index=True)
    created_by = Column("CREATED_BY", String(50))
    created_at = Column("CREATED_AT", DateTime)


class UserLog(Base):
    """USERSLOG — activity/audit log. PK = ID."""
    __tablename__ = "USERSLOG"

    id = Column("ID", Integer, primary_key=True, autoincrement=True)
    uid = Column("UID", String(50))
    remarks = Column("REMARKS", String(500))
    crat = Column("CRAT", String(50))        # legacy stores a formatted timestamp string
    ipadd = Column("IPADD", String(30))
