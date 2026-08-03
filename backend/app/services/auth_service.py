"""Login/token logic — reimplemented from the legacy `user_login` proc.

Legacy behavior preserved: routing by USERS.AUTH, blocked/password-change status.
Deliberately NOT ported: the hardcoded master passwords (p8715t / p9211t).
TODO(db-up): confirm real USERS.STATUS values and tune BLOCKED/PWD_CHANGE sets.
"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.rbac import get_user_roles
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
)
from app.models.system import User

BLOCKED_STATUS = {"B", "BLOCK", "BLOCKED", "INACTIVE", "DISABLED"}
PWD_CHANGE_STATUS = {"PC"}


class AuthError(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


def get_user(db: Session, username: str) -> User | None:
    return db.execute(select(User).where(User.uname == username)).scalars().first()


def authenticate(db: Session, username: str, password: str) -> tuple[User, bool]:
    user = get_user(db, username)
    if user is None or not verify_password(password, user.password):
        raise AuthError("invalid_credentials", "Invalid user id or password")

    status_val = (user.status or "").strip().upper()
    if status_val in BLOCKED_STATUS:
        raise AuthError("blocked", "This account is blocked by Administrator")

    # NOTE: bcrypt-on-login upgrade is deferred to Phase 8 hardening. USERS.PASSWORD is
    # varchar(50) and can't hold a 60-char bcrypt hash without widening the column — a
    # schema change we avoid while running the DB as-is. verify_password() already accepts
    # both legacy plaintext and (future) bcrypt hashes, so no re-work is needed later.
    return user, status_val in PWD_CHANGE_STATUS


def issue_tokens(db: Session, user: User) -> tuple[str, str, list[int]]:
    # Roles are keyed on the numeric USERS.ID (legacy uses Session["ID"]), not the username.
    role_uid = str(user.id)
    claims = {"auth": user.auth or "", "college_id": user.college_id, "rid": role_uid}
    access = create_access_token(user.uname, **claims)
    refresh = create_refresh_token(user.uname)
    return access, refresh, get_user_roles(db, role_uid)


def change_password(db: Session, uname: str, old_password: str, new_password: str) -> None:
    user = get_user(db, uname)
    if user is None or not verify_password(old_password, user.password):
        raise AuthError("invalid_password", "Current password is incorrect")
    if len(new_password) > 50:
        raise AuthError("too_long", "Password must be 50 characters or fewer")
    # plaintext: USERS.PASSWORD is varchar(50); bcrypt migration deferred to Phase 8.
    user.password = new_password
    db.commit()
