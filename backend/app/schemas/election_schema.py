from datetime import datetime

from pydantic import BaseModel, Field, model_validator

from app.schemas.candidate_schema import CandidateRead
from app.utils.enums import (
    ElectionStatus,
    ElectionType,
    EligibilityType,
    PartialResultType,
    PositionScope,
    ResultVisibility,
)


class EligibilityCreate(BaseModel):
    eligibility_type: EligibilityType
    college_id: int | None = None
    college: str | None = None
    organization_id: int | None = None
    organization: str | None = None


class PositionCreate(BaseModel):
    name: str
    position_scope: PositionScope = PositionScope.UNIVERSITY
    college_id: int | None = None
    college: str | None = None
    organization_id: int | None = None
    organization: str | None = None
    max_selection: int = Field(default=1, ge=1, le=20)
    display_order: int = 0


class PositionUpdate(BaseModel):
    name: str | None = None
    position_scope: PositionScope | None = None
    college_id: int | None = None
    college: str | None = None
    organization_id: int | None = None
    organization: str | None = None
    max_selection: int | None = Field(default=None, ge=1, le=20)
    display_order: int | None = None


class PositionRead(BaseModel):
    id: int
    event_id: int
    name: str
    title: str
    position_scope: PositionScope
    college_id: int | None
    college: str | None
    organization_id: int | None
    organization: str | None
    max_selection: int
    display_order: int
    candidates: list[CandidateRead] = []


class ElectionCreate(BaseModel):
    title: str = Field(min_length=3, max_length=220)
    description: str | None = None
    banner: str | None = None
    election_type: ElectionType = ElectionType.UNIVERSITY
    visibility_scope: str | None = None
    start_date: datetime
    end_date: datetime
    result_visibility: ResultVisibility = ResultVisibility.HIDDEN
    result_release_date: datetime | None = None
    partial_result_type: PartialResultType | None = None
    eligibility: list[EligibilityCreate] = Field(default_factory=list)
    positions: list[PositionCreate] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_dates(self) -> "ElectionCreate":
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        return self


class ElectionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=220)
    description: str | None = None
    banner: str | None = None
    election_type: ElectionType | None = None
    visibility_scope: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    result_visibility: ResultVisibility | None = None
    result_release_date: datetime | None = None
    partial_result_type: PartialResultType | None = None
    status: ElectionStatus | None = None


class ElectionSummary(BaseModel):
    id: int
    title: str
    description: str | None
    banner: str | None
    election_type: ElectionType
    type: str
    visibility_scope: str | None
    start_date: datetime
    end_date: datetime
    openDate: str
    closeDate: str
    result_visibility: ResultVisibility
    visibility: str
    result_release_date: datetime | None
    partial_result_type: PartialResultType | None
    status: str
    stored_status: ElectionStatus
    created_by: int | None
    votescast: int
    totalVoters: int
    eligibility: str
    has_voted: bool = False
    is_eligible: bool = False


class ElectionRead(ElectionSummary):
    positions: list[PositionRead] = []
