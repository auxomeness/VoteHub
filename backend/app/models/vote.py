from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.datetime import utcnow


class VoteRecord(Base):
    __tablename__ = "votes"
    __table_args__ = (
        UniqueConstraint("user_id", "event_id", name="uq_vote_user_event"),
        Index("ix_votes_event_submitted", "event_id", "submitted_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("voting_events.id", ondelete="CASCADE"), nullable=False, index=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", back_populates="votes")
    event = relationship("VotingEvent", back_populates="votes")
    details = relationship("VoteDetail", back_populates="vote", cascade="all, delete-orphan")


class VoteDetail(Base):
    __tablename__ = "vote_details"
    __table_args__ = (
        UniqueConstraint("vote_id", "position_id", "candidate_id", name="uq_vote_position_candidate"),
        CheckConstraint(
            "(is_abstain = true AND candidate_id IS NULL) OR (is_abstain = false AND candidate_id IS NOT NULL)",
            name="ck_vote_detail_candidate_or_abstain",
        ),
        Index(
            "uq_vote_position_abstain",
            "vote_id",
            "position_id",
            unique=True,
            sqlite_where=text("is_abstain = 1"),
            postgresql_where=text("is_abstain = true"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    vote_id: Mapped[int] = mapped_column(ForeignKey("votes.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id: Mapped[int | None] = mapped_column(ForeignKey("candidates.id", ondelete="RESTRICT"), nullable=True)
    position_id: Mapped[int] = mapped_column(ForeignKey("positions.id", ondelete="RESTRICT"), nullable=False, index=True)
    is_abstain: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    vote = relationship("VoteRecord", back_populates="details")
    candidate = relationship("Candidate", back_populates="vote_details")
    position = relationship("Position", back_populates="vote_details")
