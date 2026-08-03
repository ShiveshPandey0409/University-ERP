"""Password hashing + JWT.

Legacy passwords are plaintext. We verify against plaintext once, then transparently
re-hash to bcrypt on successful login (`needs_upgrade`), so the store self-heals.
The legacy master-password backdoors (p8715t / p9211t) are intentionally NOT ported.
"""
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _is_bcrypt(stored: str | None) -> bool:
    return bool(stored) and stored.startswith(("$2a$", "$2b$", "$2y$"))


def verify_password(plain: str, stored: str | None) -> bool:
    if not stored:
        return False
    if _is_bcrypt(stored):
        try:
            return _pwd.verify(plain, stored)
        except ValueError:
            return False
    # legacy plaintext (constant-time-ish compare)
    return _safe_eq(plain, stored)


def needs_upgrade(stored: str | None) -> bool:
    """True if the stored password is still legacy plaintext and should be re-hashed."""
    return not _is_bcrypt(stored)


def hash_password(plain: str) -> str:
    return _pwd.hash(plain)


def _safe_eq(a: str, b: str) -> bool:
    if len(a) != len(b):
        return False
    result = 0
    for x, y in zip(a, b):
        result |= ord(x) ^ ord(y)
    return result == 0


# ---- JWT ----
def _encode(sub: str, token_type: str, expires: timedelta, extra: dict[str, Any]) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": sub, "type": token_type, "iat": now, "exp": now + expires, **extra}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(sub: str, **extra: Any) -> str:
    return _encode(sub, "access", timedelta(minutes=settings.access_token_minutes), extra)


def create_refresh_token(sub: str, **extra: Any) -> str:
    return _encode(sub, "refresh", timedelta(days=settings.refresh_token_days), extra)


def decode_token(token: str) -> dict[str, Any]:
    """Raises jose.JWTError on invalid/expired tokens."""
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


__all__ = [
    "verify_password", "needs_upgrade", "hash_password",
    "create_access_token", "create_refresh_token", "decode_token", "JWTError",
]
