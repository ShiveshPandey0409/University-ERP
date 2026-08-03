"""Auth dependencies: current user + role guard."""
from dataclasses import dataclass, field

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.rbac import get_user_roles
from app.core.security import JWTError, decode_token
from app.db.session import get_db

bearer = HTTPBearer(auto_error=True)


@dataclass
class Principal:
    uname: str
    auth: str
    role_uid: str = ""          # numeric USERS.ID used for role lookup (legacy Session["ID"])
    college_id: str | None = None
    roles: list[int] = field(default_factory=list)


def get_current_user(
    cred: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> Principal:
    try:
        payload = decode_token(cred.credentials)
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    if payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not an access token")
    uname = payload.get("sub")
    if not uname:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token subject")
    role_uid = payload.get("rid", "")
    return Principal(
        uname=uname,
        auth=payload.get("auth", ""),
        role_uid=role_uid,
        college_id=payload.get("college_id"),
        roles=get_user_roles(db, role_uid) if role_uid else [],
    )


def require_roles(*role_ids: int, require_all: bool = False):
    """Dependency factory: gate an endpoint on holding ANY (default) or ALL of role_ids."""

    def dep(user: Principal = Depends(get_current_user)) -> Principal:
        if not role_ids:
            return user
        held = set(user.roles)
        needed = set(role_ids)
        ok = needed <= held if require_all else bool(held & needed)
        if not ok:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient role")
        return user

    return dep
