from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.datetime import utcnow
from app.utils.enums import ElectionStatus, ElectionType, PartialResultType, ResultVisibility


class VotingEvent(Base):
    __tablename__ = "voting_events"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(220), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    banner: Mapped[str | None] = mapped_column(String(500), nullable=True)
    election_type: Mapped[ElectionType] = mapped_column(
        Enum(ElectionType, native_enum=False),
        default=ElectionType.UNIVERSITY,
        nullable=False,
    )
    visibility_scope: Mapped[str | None] = mapped_column(String(120), nullable=True)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    result_visibility: Mapped[ResultVisibility] = mapped_column(
        Enum(ResultVisibility, native_enum=False),
        default=ResultVisibility.HIDDEN,
        nullable=False,
    )
    result_release_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    partial_result_type: Mapped[PartialResultType | None] = mapped_column(
        Enum(PartialResultType, native_enum=False),
        nullable=True,
    )
    results_published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[ElectionStatus] = mapped_column(
        Enum(ElectionStatus, native_enum=False),
        default=ElectionStatus.UPCOMING,
        nullable=False,
    )
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )

    creator = relationship("User", back_populates="created_events")
    positions = relationship("Position", back_populates="event", cascade="all, delete-orphan")
    eligibilities = relationship("ElectionEligibility", back_populates="event", cascade="all, delete-orphan")
    votes = relationship("VoteRecord", back_populates="event", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="event")
