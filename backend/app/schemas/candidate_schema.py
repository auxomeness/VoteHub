from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.utils.enums import CandidateStatus


class CandidateCreate(BaseModel):
    position_id: int
    name: str = Field(min_length=2, max_length=180)
    photo: str | None = None
    course: str | None = None
    college_id: int | None = None
    college: str | None = None
    organization_id: int | None = None
    organization: str | None = None
    platform: str | None = None
    biography: str | None = None
    status: CandidateStatus = CandidateStatus.ACTIVE


class CandidateUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=180)
    photo: str | None = None
    course: str | None = None
    college_id: int | None = None
    college: str | None = None
    organization_id: int | None = None
    organization: str | None = None
    platform: str | None = None
    biography: str | None = None
    status: CandidateStatus | None = None


class CandidateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    position_id: int
    name: str
    photo: str | None
    course: str | None
    college_id: int | None
    college: str | None
    org: str | None
    organization_id: int | None
    organization: str | None
    platform: str | None
    biography: str | None
    status: CandidateStatus
    created_at: datetime
