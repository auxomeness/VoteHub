from sqlalchemy import Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.enums import EligibilityType


class ElectionEligibility(Base):
    __tablename__ = "election_eligibilities"
    __table_args__ = (
        UniqueConstraint(
            "event_id",
            "eligibility_type",
            "college_id",
            "organization_id",
            name="uq_event_eligibility_rule",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("voting_events.id", ondelete="CASCADE"), nullable=False, index=True)
    eligibility_type: Mapped[EligibilityType] = mapped_column(
        Enum(EligibilityType, native_enum=False),
        nullable=False,
    )
    college_id: Mapped[int | None] = mapped_column(ForeignKey("colleges.id", ondelete="CASCADE"), nullable=True)
    organization_id: Mapped[int | None] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=True,
    )

    event = relationship("VotingEvent", back_populates="eligibilities")
    college = relationship("College", back_populates="eligibilities")
    organization = relationship("Organization", back_populates="eligibilities")
