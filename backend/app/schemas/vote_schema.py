from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class VoteSelection(BaseModel):
    position_id: int
    candidate_id: int | None = None
    is_abstain: bool = False

    @model_validator(mode="after")
    def normalize_abstain(self) -> "VoteSelection":
        if self.candidate_id == 0:
            self.candidate_id = None
            self.is_abstain = True
        if self.candidate_id is None and not self.is_abstain:
            raise ValueError("candidate_id is required unless is_abstain is true")
        return self


class VoteSubmit(BaseModel):
    event_id: int
    selections: list[VoteSelection] = Field(min_length=1)


class VoteReceipt(BaseModel):
    vote_id: int
    event_id: int
    receipt_code: str
    submitted_at: datetime


class VoteStatusRead(BaseModel):
    event_id: int
    eligible: bool
    has_voted: bool
    status: str
