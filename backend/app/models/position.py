from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.datetime import utcnow
from app.utils.enums import PositionScope


class Position(Base):
    __tablename__ = "positions"
    __table_args__ = (UniqueConstraint("event_id", "name", name="uq_position_event_name"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("voting_events.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    position_scope: Mapped[PositionScope] = mapped_column(
        Enum(PositionScope, native_enum=False),
        default=PositionScope.UNIVERSITY,
        nullable=False,
    )
    college_id: Mapped[int | None] = mapped_column(ForeignKey("colleges.id", ondelete="SET NULL"), nullable=True)
    organization_id: Mapped[int | None] = mapped_column(
        ForeignKey("organizations.id", ondelete="SET NULL"),
        nullable=True,
    )
    max_selection: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    event = relationship("VotingEvent", back_populates="positions")
    college = relationship("College", back_populates="positions")
    organization = relationship("Organization", back_populates="positions")
    candidates = relationship("Candidate", back_populates="position", cascade="all, delete-orphan")
    vote_details = relationship("VoteDetail", back_populates="position")
