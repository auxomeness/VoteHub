from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.utils.enums import RecordStatus


class OrganizationCreate(BaseModel):
    name: str
    description: str | None = None
    status: RecordStatus = RecordStatus.ACTIVE


class OrganizationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: RecordStatus | None = None


class OrganizationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    status: RecordStatus
    created_at: datetime
    updated_at: datetime
    member_count: int = 0
