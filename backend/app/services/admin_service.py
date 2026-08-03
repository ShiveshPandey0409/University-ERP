"""SysAdmin business logic — reimplemented from the legacy user/role/menu procs
(users_list, user_new/update, users_rolls, system_rolls, sysroll_*, MenuManager SQL).
Role assignment rebuilds UROLLS safely (parameterized), replacing the legacy
string-concatenated DELETE/INSERT (which was SQL-injectable).
"""
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.audit import now_ist
from app.core.security import hash_password
from app.models.system import (
    MenuItem,
    MenuRoleMapping,
    SysRole,
    User,
    UserAdmin,
    UserRole,
)


class ConflictError(Exception):
    pass


class NotFoundError(Exception):
    pass


# ---------- Roles ----------
def list_roles(db: Session) -> list[SysRole]:
    return list(db.execute(select(SysRole).order_by(SysRole.categ, SysRole.roll_name)).scalars())


def create_role(db: Session, categ: str | None, roll_name: str, by: str) -> SysRole:
    role = SysRole(categ=categ, roll_name=roll_name, updby=by, updat=now_ist())
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def update_role(db: Session, role_id: int, categ: str | None, roll_name: str, by: str) -> SysRole:
    role = db.get(SysRole, role_id)
    if role is None:
        raise NotFoundError("Role not found")
    role.categ, role.roll_name, role.updby, role.updat = categ, roll_name, by, now_ist()
    db.commit()
    db.refresh(role)
    return role


# ---------- Users ----------
def _role_uid(db: Session, uname: str) -> str | None:
    """Roles are stored in UROLLS keyed by the numeric USERS.ID, not the username."""
    uid = db.execute(select(User.id).where(User.uname == uname)).scalar()
    return str(uid) if uid is not None else None


def get_user_roles(db: Session, uname: str) -> list[int]:
    ruid = _role_uid(db, uname)
    if ruid is None:
        return []
    rows = db.execute(select(UserRole.uroll).where(UserRole.uid == ruid)).scalars().all()
    return sorted({int(r) for r in rows if r is not None})


def list_users(db: Session) -> list[dict]:
    rows = db.execute(
        select(UserAdmin, User).outerjoin(User, User.uname == UserAdmin.uname)
    ).all()
    out: list[dict] = []
    for admin, user in rows:
        out.append(
            {
                "uname": admin.uname,
                "name": admin.name,
                "mobile": admin.mobile,
                "email": admin.email,
                "auth": user.auth if user else None,
                "college_id": user.college_id if user else None,
                "status": admin.status,
                "roles": get_user_roles(db, admin.uname),
            }
        )
    return out


def create_user(db: Session, data, by: str) -> dict:
    if db.get(UserAdmin, data.uname) is not None:
        raise ConflictError("User already exists")
    db.add(UserAdmin(uname=data.uname, name=data.name, mobile=data.mobile,
                     email=data.email, status="Active", upby=by, upat=now_ist()))
    db.add(User(uname=data.uname, password=hash_password(data.password),
                college_id=data.college_id, auth=data.auth, status="Active", upat=now_ist()))
    db.commit()
    set_user_roles(db, data.uname, data.roles, by)
    return _user_dict(db, data.uname)


def update_user(db: Session, uname: str, data, by: str) -> dict:
    admin = db.get(UserAdmin, uname)
    user = db.execute(select(User).where(User.uname == uname)).scalars().first()
    if admin is None and user is None:
        raise NotFoundError("User not found")
    if admin is not None:
        for f in ("name", "mobile", "email", "status"):
            v = getattr(data, f)
            if v is not None:
                setattr(admin, f, v)
        admin.upby, admin.upat = by, now_ist()
    if user is not None:
        for f in ("auth", "college_id", "status"):
            v = getattr(data, f)
            if v is not None:
                setattr(user, f, v)
    db.commit()
    return _user_dict(db, uname)


def set_user_roles(db: Session, uname: str, roles: list[int], by: str) -> list[int]:
    ruid = _role_uid(db, uname)
    if ruid is None:
        raise NotFoundError("User not found")
    db.execute(delete(UserRole).where(UserRole.uid == ruid))
    for r in sorted(set(roles)):
        db.add(UserRole(uid=ruid, uroll=int(r)))
    db.commit()
    return get_user_roles(db, uname)


def _user_dict(db: Session, uname: str) -> dict:
    admin = db.get(UserAdmin, uname)
    user = db.execute(select(User).where(User.uname == uname)).scalars().first()
    return {
        "uname": uname,
        "name": admin.name if admin else None,
        "mobile": admin.mobile if admin else None,
        "email": admin.email if admin else None,
        "auth": user.auth if user else None,
        "college_id": user.college_id if user else None,
        "status": admin.status if admin else (user.status if user else None),
        "roles": get_user_roles(db, uname),
    }


# ---------- Menu ----------
def _menu_role_ids(db: Session, menu_id: int) -> list[int]:
    return sorted(
        db.execute(
            select(MenuRoleMapping.role_id).where(MenuRoleMapping.menu_id == menu_id)
        ).scalars()
    )


def list_menu(db: Session) -> list[dict]:
    items = db.execute(select(MenuItem).order_by(MenuItem.display_order, MenuItem.id)).scalars().all()
    return [
        {
            "id": it.id,
            "parent_id": it.parent_id,
            "menu_text": it.menu_text,
            "menu_url": it.menu_url,
            "menu_icon": it.menu_icon,
            "menu_section": it.menu_section,
            "display_order": it.display_order,
            "is_active": it.is_active,
            "role_ids": _menu_role_ids(db, it.id),
        }
        for it in items
    ]


def create_menu(db: Session, data, by: str) -> dict:
    item = MenuItem(
        parent_id=data.parent_id, menu_text=data.menu_text, menu_url=data.menu_url,
        menu_icon=data.menu_icon, menu_section=data.menu_section,
        display_order=data.display_order, is_active=data.is_active,
        created_by=by, created_at=now_ist(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    _set_menu_roles(db, item.id, data.role_ids, by)
    return _menu_dict(db, item.id)


def update_menu(db: Session, menu_id: int, data, by: str) -> dict:
    item = db.get(MenuItem, menu_id)
    if item is None:
        raise NotFoundError("Menu item not found")
    item.parent_id = data.parent_id
    item.menu_text = data.menu_text
    item.menu_url = data.menu_url
    item.menu_icon = data.menu_icon
    item.menu_section = data.menu_section
    item.display_order = data.display_order
    item.is_active = data.is_active
    item.modified_by, item.modified_at = by, now_ist()
    db.commit()
    _set_menu_roles(db, menu_id, data.role_ids, by)
    return _menu_dict(db, menu_id)


def delete_menu(db: Session, menu_id: int) -> None:
    item = db.get(MenuItem, menu_id)
    if item is None:
        raise NotFoundError("Menu item not found")
    db.execute(delete(MenuRoleMapping).where(MenuRoleMapping.menu_id == menu_id))
    db.delete(item)
    db.commit()


def _set_menu_roles(db: Session, menu_id: int, role_ids: list[int], by: str) -> None:
    db.execute(delete(MenuRoleMapping).where(MenuRoleMapping.menu_id == menu_id))
    for rid in sorted(set(role_ids)):
        db.add(MenuRoleMapping(menu_id=menu_id, role_id=int(rid), created_by=by, created_at=now_ist()))
    db.commit()


def _menu_dict(db: Session, menu_id: int) -> dict:
    it = db.get(MenuItem, menu_id)
    return {
        "id": it.id,
        "parent_id": it.parent_id,
        "menu_text": it.menu_text,
        "menu_url": it.menu_url,
        "menu_icon": it.menu_icon,
        "menu_section": it.menu_section,
        "display_order": it.display_order,
        "is_active": it.is_active,
        "role_ids": _menu_role_ids(db, menu_id),
    }
