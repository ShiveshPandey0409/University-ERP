"""Auth endpoints: login, refresh, me."""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.audit import user_log
from app.core.deps import Principal, get_current_user
from app.core.security import JWTError, create_access_token, create_refresh_token, decode_token
from app.db.session import get_db
from app.schemas.auth import LoginRequest, MeResponse, RefreshRequest, TokenResponse
from app.services.auth_service import AuthError, authenticate, get_user, issue_tokens

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        user, must_change = authenticate(db, body.username.strip(), body.password)
    except AuthError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, exc.message)
    access, refresh, _roles = issue_tokens(db, user)
    user_log(db, user.uname, "Login", request.client.host if request.client else None)
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        auth=user.auth or "",
        must_change_password=must_change,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        payload = decode_token(body.refresh_token)
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")
    if payload.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not a refresh token")
    user = get_user(db, payload.get("sub", ""))
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User no longer exists")
    claims = {"auth": user.auth or "", "college_id": user.college_id, "rid": str(user.id)}
    return TokenResponse(
        access_token=create_access_token(user.uname, **claims),
        refresh_token=create_refresh_token(user.uname),
        auth=user.auth or "",
    )


@router.get("/me", response_model=MeResponse)
def me(user: Principal = Depends(get_current_user)) -> MeResponse:
    return MeResponse(username=user.uname, auth=user.auth, roles=user.roles)
