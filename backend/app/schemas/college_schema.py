from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.utils.enums import RecordStatus


class CollegeCreate(BaseModel):
    name: str
    abbreviation: str
    status: RecordStatus = RecordStatus.ACTIVE


class CollegeUpdate(BaseModel):
    name: str | None = None
    abbreviation: str | None = None
    status: RecordStatus | None = None


class CollegeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    abbreviation: str
    status: RecordStatus
    created_at: datetime
    updated_at: datetime
