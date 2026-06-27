from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.datetime import utcnow
from app.utils.enums import CandidateStatus


class Candidate(Base):
    __tablename__ = "candidates"
    __table_args__ = (UniqueConstraint("position_id", "name", name="uq_candidate_position_name"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    position_id: Mapped[int] = mapped_column(ForeignKey("positions.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    photo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    course: Mapped[str | None] = mapped_column(String(180), nullable=True)
    college_id: Mapped[int | None] = mapped_column(ForeignKey("colleges.id", ondelete="SET NULL"), nullable=True)
    organization_id: Mapped[int | None] = mapped_column(
        ForeignKey("organizations.id", ondelete="SET NULL"),
        nullable=True,
    )
    platform: Mapped[str | None] = mapped_column(Text, nullable=True)
    biography: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[CandidateStatus] = mapped_column(
        Enum(CandidateStatus, native_enum=False),
        default=CandidateStatus.ACTIVE,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    position = relationship("Position", back_populates="candidates")
    college = relationship("College", back_populates="candidates")
    organization = relationship("Organization", back_populates="candidates")
    vote_details = relationship("VoteDetail", back_populates="candidate")
