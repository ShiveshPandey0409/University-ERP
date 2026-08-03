"""Schemas for SysAdmin: users, roles, menu management."""
from pydantic import BaseModel, Field


# ---- Roles (SYSROLL) ----
class RoleOut(BaseModel):
    id: int
    categ: str | None = None
    roll_name: str | None = None


class RoleIn(BaseModel):
    categ: str | None = None
    roll_name: str = Field(min_length=1)


# ---- Users (USERSADMIN + USERS) ----
class UserOut(BaseModel):
    uname: str
    name: str | None = None
    mobile: str | None = None
    email: str | None = None
    auth: str | None = None
    college_id: str | None = None
    status: str | None = None
    roles: list[int] = []


class UserCreate(BaseModel):
    uname: str = Field(min_length=1)
    password: str = Field(min_length=4)
    name: str | None = None
    mobile: str | None = None
    email: str | None = None
    auth: str = "Univ"
    college_id: str | None = None
    roles: list[int] = []


class UserUpdate(BaseModel):
    name: str | None = None
    mobile: str | None = None
    email: str | None = None
    auth: str | None = None
    college_id: str | None = None
    status: str | None = None


class RolesAssign(BaseModel):
    roles: list[int]


# ---- Menu (MENU_ITEMS + MENU_ROLE_MAPPING) ----
class MenuItemOut(BaseModel):
    id: int
    parent_id: int | None = None
    menu_text: str
    menu_url: str | None = None
    menu_icon: str | None = None
    menu_section: str | None = None
    display_order: int | None = None
    is_active: bool | None = None
    role_ids: list[int] = []


class MenuItemIn(BaseModel):
    parent_id: int | None = None
    menu_text: str = Field(min_length=1)
    menu_url: str | None = None
    menu_icon: str | None = None
    menu_section: str | None = None
    display_order: int = 0
    is_active: bool = True
    role_ids: list[int] = []
