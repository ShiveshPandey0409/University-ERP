"""Schemas for grievance, notices, degree, fees (back-office)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ComplaintCategOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    categ: str | None = None


class ComplaintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    enroll_no: str | None = None
    details: str | None = None
    category: str | None = None
    status: str | None = None
    assign: str | None = None
    crby: str | None = None
    crat: datetime | None = None


class ComplaintStatus(BaseModel):
    opened: int
    closed: int
    assigned: int
    not_assigned: int


class ComplaintRegisterRequest(BaseModel):
    category: str
    remarks: str
    file_name: str | None = None


class ComplaintUpdateRequest(BaseModel):
    remarks: str | None = None
    status: str | None = None
    assign: str | None = None


class NoticeOut(BaseModel):
    id: int
    details: str | None = None


class NoticeUpdateRequest(BaseModel):
    details: str


class DegreeDashboard(BaseModel):
    applied: int
    pending: int
    printing: int
    delivered: int
