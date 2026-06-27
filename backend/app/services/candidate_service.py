from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.candidate import Candidate
from app.models.position import Position
from app.models.user import User
from app.schemas.candidate_schema import CandidateCreate, CandidateUpdate
from app.services.audit_service import write_audit_log
from app.services.helpers import get_college_by_ref, get_organization_by_ref, serialize_candidate
from app.utils.enums import AuditAction


def list_candidates(db: Session, event_id: int | None = None, position_id: int | None = None) -> list[dict]:
    stmt = select(Candidate).options(selectinload(Candidate.college), selectinload(Candidate.organization))
    if position_id is not None:
        stmt = stmt.where(Candidate.position_id == position_id)
    if event_id is not None:
        stmt = stmt.join(Position).where(Position.event_id == event_id)
    stmt = stmt.order_by(Candidate.created_at.desc())
    return [serialize_candidate(candidate) for candidate in db.scalars(stmt).all()]


def create_candidate(db: Session, payload: CandidateCreate, actor: User) -> dict:
    position = db.get(Position, payload.position_id)
    if position is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Position not found")
    college = get_college_by_ref(db, payload.college_id, payload.college)
    organization = get_organization_by_ref(db, payload.organization_id, payload.organization)
    candidate = Candidate(
        position_id=position.id,
        name=payload.name,
        photo=payload.photo,
        course=payload.course,
        college_id=college.id if college else None,
        organization_id=organization.id if organization else None,
        platform=payload.platform,
        biography=payload.biography,
        status=payload.status,
    )
    db.add(candidate)
    db.flush()
    write_audit_log(
        db,
        AuditAction.CANDIDATE_CREATED,
        user_id=actor.id,
        event_id=position.event_id,
        entity_type="candidate",
        entity_id=candidate.id,
    )
    db.commit()
    db.refresh(candidate)
    return serialize_candidate(candidate)


def update_candidate(db: Session, candidate_id: int, payload: CandidateUpdate, actor: User) -> dict:
    candidate = db.get(Candidate, candidate_id)
    if candidate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    data = payload.model_dump(exclude_unset=True)
    if "college" in data or "college_id" in data:
        college = get_college_by_ref(db, data.pop("college_id", None), data.pop("college", None))
        candidate.college_id = college.id if college else None
    if "organization" in data or "organization_id" in data:
        organization = get_organization_by_ref(db, data.pop("organization_id", None), data.pop("organization", None))
        candidate.organization_id = organization.id if organization else None
    for key, value in data.items():
        setattr(candidate, key, value)
    write_audit_log(
        db,
        AuditAction.CANDIDATE_UPDATED,
        user_id=actor.id,
        event_id=candidate.position.event_id,
        entity_type="candidate",
        entity_id=candidate.id,
    )
    db.commit()
    db.refresh(candidate)
    return serialize_candidate(candidate)


def delete_candidate(db: Session, candidate_id: int, actor: User) -> None:
    candidate = db.get(Candidate, candidate_id)
    if candidate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    write_audit_log(
        db,
        AuditAction.CANDIDATE_UPDATED,
        user_id=actor.id,
        event_id=candidate.position.event_id,
        entity_type="candidate",
        entity_id=candidate.id,
        metadata={"deleted": True},
    )
    db.delete(candidate)
    db.commit()
