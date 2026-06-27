from datetime import datetime

from sqlalchemy import DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.datetime import utcnow
from app.utils.enums import RecordStatus


class College(Base):
    __tablename__ = "colleges"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(180), unique=True, nullable=False)
    abbreviation: Mapped[str] = mapped_column(String(16), unique=True, nullable=False, index=True)
    status: Mapped[RecordStatus] = mapped_column(
        Enum(RecordStatus, native_enum=False),
        default=RecordStatus.ACTIVE,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )

    users = relationship("User", back_populates="college")
    positions = relationship("Position", back_populates="college")
    candidates = relationship("Candidate", back_populates="college")
    eligibilities = relationship("ElectionEligibility", back_populates="college")
