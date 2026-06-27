from pydantic import BaseModel


class MetricRead(BaseModel):
    label: str
    value: int | float | str
    sub: str | None = None


class DashboardAnalytics(BaseModel):
    total_students: int
    active_students: int
    total_elections: int
    active_elections: int
    votes_cast: int
    participation_rate: float


class ParticipationBucket(BaseModel):
    label: str
    eligible: int
    votes: int
    rate: float


class TimelineBucket(BaseModel):
    label: str
    votes: int
    cumulative: int


class ElectionAnalytics(BaseModel):
    event_id: int
    summary: DashboardAnalytics
    by_college: list[ParticipationBucket]
    by_year_level: list[ParticipationBucket]
    by_organization: list[ParticipationBucket]
    hourly_votes: list[TimelineBucket]
