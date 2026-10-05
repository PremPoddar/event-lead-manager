from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class Status(str, Enum):
    new = "new"
    contacted = "contacted"
    follow_up = "follow_up"
    closed = "closed"


class LeadBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    company: str = Field(default="", max_length=120)
    email: EmailStr
    event: str = Field(min_length=1, max_length=120)
    notes: str = ""
    status: Status = Status.new


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    company: str | None = Field(default=None, max_length=120)
    email: EmailStr | None = None
    event: str | None = Field(default=None, min_length=1, max_length=120)
    notes: str | None = None
    status: Status | None = None


class LeadOut(LeadBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    summary: str | None
    created_at: datetime
    updated_at: datetime


class DraftRequest(BaseModel):
    tone: str = Field(default="friendly", max_length=30)


class DraftOut(BaseModel):
    subject: str
    body: str
