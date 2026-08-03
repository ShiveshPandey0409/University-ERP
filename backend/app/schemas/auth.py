"""Pydantic request/response models for auth + menu."""
from __future__ import annotations

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    auth: str
    must_change_password: bool = False


class RefreshRequest(BaseModel):
    refresh_token: str


class MeResponse(BaseModel):
    username: str
    auth: str
    roles: list[int]


class MenuNode(BaseModel):
    id: int
    text: str
    url: str | None = None
    icon: str | None = None
    section: str | None = None
    children: list["MenuNode"] = []


MenuNode.model_rebuild()
