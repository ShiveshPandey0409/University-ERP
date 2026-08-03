"""SysAdmin endpoints: manage users, roles, and the menu. Gated on role 1 (System Admin)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import Principal, require_roles
from app.db.session import get_db
from app.schemas.admin import (
    MenuItemIn,
    MenuItemOut,
    RoleIn,
    RoleOut,
    RolesAssign,
    UserCreate,
    UserOut,
    UserUpdate,
)
from app.services import admin_service as svc

SYS_ADMIN = require_roles(1)  # role 1 = System Admin

router = APIRouter(prefix="/admin", tags=["admin"])


# ---- Roles ----
@router.get("/roles", response_model=list[RoleOut])
def list_roles(db: Session = Depends(get_db), _: Principal = Depends(SYS_ADMIN)):
    return svc.list_roles(db)


@router.post("/roles", response_model=RoleOut, status_code=201)
def create_role(body: RoleIn, db: Session = Depends(get_db), user: Principal = Depends(SYS_ADMIN)):
    return svc.create_role(db, body.categ, body.roll_name, user.uname)


@router.put("/roles/{role_id}", response_model=RoleOut)
def update_role(role_id: int, body: RoleIn, db: Session = Depends(get_db), user: Principal = Depends(SYS_ADMIN)):
    try:
        return svc.update_role(db, role_id, body.categ, body.roll_name, user.uname)
    except svc.NotFoundError as exc:
        raise HTTPException(404, str(exc))


# ---- Users ----
@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: Principal = Depends(SYS_ADMIN)):
    return svc.list_users(db)


@router.post("/users", response_model=UserOut, status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db), user: Principal = Depends(SYS_ADMIN)):
    try:
        return svc.create_user(db, body, user.uname)
    except svc.ConflictError as exc:
        raise HTTPException(409, str(exc))


@router.put("/users/{uname}", response_model=UserOut)
def update_user(uname: str, body: UserUpdate, db: Session = Depends(get_db), user: Principal = Depends(SYS_ADMIN)):
    try:
        return svc.update_user(db, uname, body, user.uname)
    except svc.NotFoundError as exc:
        raise HTTPException(404, str(exc))


@router.put("/users/{uname}/roles", response_model=list[int])
def set_user_roles(uname: str, body: RolesAssign, db: Session = Depends(get_db), user: Principal = Depends(SYS_ADMIN)):
    return svc.set_user_roles(db, uname, body.roles, user.uname)


# ---- Menu ----
@router.get("/menu", response_model=list[MenuItemOut])
def list_menu(db: Session = Depends(get_db), _: Principal = Depends(SYS_ADMIN)):
    return svc.list_menu(db)


@router.post("/menu", response_model=MenuItemOut, status_code=201)
def create_menu(body: MenuItemIn, db: Session = Depends(get_db), user: Principal = Depends(SYS_ADMIN)):
    return svc.create_menu(db, body, user.uname)


@router.put("/menu/{menu_id}", response_model=MenuItemOut)
def update_menu(menu_id: int, body: MenuItemIn, db: Session = Depends(get_db), user: Principal = Depends(SYS_ADMIN)):
    try:
        return svc.update_menu(db, menu_id, body, user.uname)
    except svc.NotFoundError as exc:
        raise HTTPException(404, str(exc))


@router.delete("/menu/{menu_id}", status_code=204)
def delete_menu(menu_id: int, db: Session = Depends(get_db), _: Principal = Depends(SYS_ADMIN)):
    try:
        svc.delete_menu(db, menu_id)
    except svc.NotFoundError as exc:
        raise HTTPException(404, str(exc))
