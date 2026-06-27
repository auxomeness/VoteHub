from types import SimpleNamespace

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.election import VotingEvent
from app.models.eligibility import ElectionEligibility
from app.models.position import Position
from app.models.user import User
from app.models.vote import VoteDetail
from app.models.vote import VoteRecord
from app.schemas.election_schema import ElectionCreate, ElectionUpdate, PositionCreate, PositionUpdate
from app.services.audit_service import write_audit_log
from app.services.eligibility_service import count_eligible_voters, is_user_eligible
from app.services.helpers import (
    election_type_label,
    eligibility_label,
    event_status,
    format_date,
    get_college_by_ref,
    get_organization_by_ref,
    result_visibility_label,
    serialize_position,
)
from app.utils.enums import AuditAction, ElectionStatus, EligibilityType, UserRole


def get_event_or_404(db: Session, event_id: int) -> VotingEvent:
    event = db.scalar(
        select(VotingEvent)
        .where(VotingEvent.id == event_id)
        .options(
            selectinload(VotingEvent.eligibilities).selectinload(ElectionEligibility.college),
            selectinload(VotingEvent.eligibilities).selectinload(ElectionEligibility.organization),
            selectinload(VotingEvent.positions).selectinload(Position.candidates),
            selectinload(VotingEvent.positions).selectinload(Position.college),
            selectinload(VotingEvent.positions).selectinload(Position.organization),
        )
    )
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Election not found")
    return event


def serialize_event(db: Session, event: VotingEvent, current_user: User | None = None, include_positions: bool = False) -> dict:
    status_value = event_status(event)
    votes_cast = db.scalar(select(func.count(VoteRecord.id)).where(VoteRecord.event_id == event.id)) or 0
    total_voters = count_eligible_voters(db, event)
    has_voted = False
    eligible = False
    if current_user is not None:
        eligible = is_user_eligible(current_user, event)
        has_voted = (
            db.scalar(
                select(func.count(VoteRecord.id)).where(
                    VoteRecord.event_id == event.id,
                    VoteRecord.user_id == current_user.id,
                )
            )
            or 0
        ) > 0

    data = {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "banner": event.banner,
        "election_type": event.election_type,
        "type": election_type_label(event.election_type),
        "visibility_scope": event.visibility_scope,
        "start_date": event.start_date,
        "end_date": event.end_date,
        "openDate": format_date(event.start_date),
        "closeDate": format_date(event.end_date),
        "result_visibility": event.result_visibility,
        "visibility": result_visibility_label(event.result_visibility),
        "result_release_date": event.result_release_date,
        "partial_result_type": event.partial_result_type,
        "status": status_value.value.lower(),
        "stored_status": event.status,
        "created_by": event.created_by,
        "votescast": votes_cast,
        "totalVoters": total_voters,
        "eligibility": eligibility_label(event),
        "has_voted": has_voted,
        "is_eligible": eligible,
    }
    if include_positions:
        data["positions"] = [
            serialize_position(position)
            for position in sorted(event.positions, key=lambda item: (item.display_order, item.id))
        ]
    return data


def list_elections(db: Session, current_user: User | None = None) -> list[dict]:
    events = db.scalars(
        select(VotingEvent)
        .options(
            selectinload(VotingEvent.eligibilities).selectinload(ElectionEligibility.college),
            selectinload(VotingEvent.eligibilities).selectinload(ElectionEligibility.organization),
        )
        .order_by(VotingEvent.start_date.desc())
    ).all()
    if current_user is not None and current_user.role == UserRole.STUDENT:
        events = [event for event in events if is_user_eligible(current_user, event)]
    return [serialize_event(db, event, current_user=current_user) for event in events]


def get_election(db: Session, event_id: int, current_user: User | None = None) -> dict:
    return serialize_event(db, get_event_or_404(db, event_id), current_user=current_user, include_positions=True)


def _create_eligibility(db: Session, event: VotingEvent, payload) -> ElectionEligibility:
    college = get_college_by_ref(db, payload.college_id, payload.college)
    organization = get_organization_by_ref(db, payload.organization_id, payload.organization)
    return ElectionEligibility(
        event=event,
        eligibility_type=payload.eligibility_type,
        college_id=college.id if college else None,
        organization_id=organization.id if organization else None,
    )


def _create_position(db: Session, event: VotingEvent, payload) -> Position:
    college = get_college_by_ref(db, payload.college_id, payload.college)
    organization = get_organization_by_ref(db, payload.organization_id, payload.organization)
    return Position(
        event=event,
        name=payload.name,
        position_scope=payload.position_scope,
        college_id=college.id if college else None,
        organization_id=organization.id if organization else None,
        max_selection=payload.max_selection,
        display_order=payload.display_order,
    )


def create_election(db: Session, payload: ElectionCreate, creator: User) -> dict:
    event = VotingEvent(
        title=payload.title,
        description=payload.description,
        banner=payload.banner,
        election_type=payload.election_type,
        visibility_scope=payload.visibility_scope,
        start_date=payload.start_date,
        end_date=payload.end_date,
        result_visibility=payload.result_visibility,
        result_release_date=payload.result_release_date,
        partial_result_type=payload.partial_result_type,
        status=ElectionStatus.UPCOMING,
        created_by=creator.id,
    )
    event.status = event_status(event)
    db.add(event)
    db.flush()

    rules = payload.eligibility or [
        SimpleNamespace(
            eligibility_type=EligibilityType.ALL_STUDENTS,
            college_id=None,
            college=None,
            organization_id=None,
            organization=None,
        )
    ]
    for rule in rules:
        db.add(_create_eligibility(db, event, rule))
    for position in payload.positions:
        db.add(_create_position(db, event, position))

    write_audit_log(
        db,
        AuditAction.ELECTION_CREATED,
        user_id=creator.id,
        event_id=event.id,
        entity_type="voting_event",
        entity_id=event.id,
    )
    db.commit()
    return get_election(db, event.id, current_user=creator)


def update_election(db: Session, event_id: int, payload: ElectionUpdate, actor: User) -> dict:
    event = get_event_or_404(db, event_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, key, value)
    if event.status != ElectionStatus.ARCHIVED:
        event.status = event_status(event)
    write_audit_log(
        db,
        AuditAction.ELECTION_UPDATED,
        user_id=actor.id,
        event_id=event.id,
        entity_type="voting_event",
        entity_id=event.id,
    )
    db.commit()
    return get_election(db, event.id, current_user=actor)


def get_ballot(db: Session, event_id: int, current_user: User) -> dict:
    event = get_event_or_404(db, event_id)
    if not is_user_eligible(current_user, event):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not eligible for this election")

    positions = []
    for position in sorted(event.positions, key=lambda item: (item.display_order, item.id)):
        if position.college_id is not None and position.college_id != current_user.college_id:
            continue
        if position.organization_id is not None and position.organization_id != current_user.organization_id:
            continue
        positions.append(serialize_position(position))
    data = serialize_event(db, event, current_user=current_user)
    data["positions"] = positions
    return data


def add_position(db: Session, event_id: int, payload: PositionCreate, actor: User) -> dict:
    event = get_event_or_404(db, event_id)
    position = _create_position(db, event, payload)
    db.add(position)
    write_audit_log(
        db,
        AuditAction.ELECTION_UPDATED,
        user_id=actor.id,
        event_id=event.id,
        entity_type="position",
        entity_id=position.id,
        metadata={"action": "position_created"},
    )
    db.commit()
    db.refresh(position)
    return serialize_position(position)


def update_position(db: Session, event_id: int, position_id: int, payload: PositionUpdate, actor: User) -> dict:
    position = db.scalar(select(Position).where(Position.id == position_id, Position.event_id == event_id))
    if position is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Position not found")
    data = payload.model_dump(exclude_unset=True)
    if "college" in data or "college_id" in data:
        college = get_college_by_ref(db, data.pop("college_id", None), data.pop("college", None))
        position.college_id = college.id if college else None
    if "organization" in data or "organization_id" in data:
        organization = get_organization_by_ref(db, data.pop("organization_id", None), data.pop("organization", None))
        position.organization_id = organization.id if organization else None
    for key, value in data.items():
        setattr(position, key, value)
    write_audit_log(
        db,
        AuditAction.ELECTION_UPDATED,
        user_id=actor.id,
        event_id=event_id,
        entity_type="position",
        entity_id=position.id,
        metadata={"action": "position_updated"},
    )
    db.commit()
    db.refresh(position)
    return serialize_position(position)


def delete_position(db: Session, event_id: int, position_id: int, actor: User) -> None:
    position = db.scalar(select(Position).where(Position.id == position_id, Position.event_id == event_id))
    if position is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Position not found")
    vote_count = db.scalar(select(func.count(VoteDetail.id)).where(VoteDetail.position_id == position.id)) or 0
    if vote_count > 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete a position with recorded votes")
    write_audit_log(
        db,
        AuditAction.ELECTION_UPDATED,
        user_id=actor.id,
        event_id=event_id,
        entity_type="position",
        entity_id=position.id,
        metadata={"action": "position_deleted"},
    )
    db.delete(position)
    db.commit()


def replace_eligibility(db: Session, event_id: int, rules: list, actor: User) -> dict:
    event = get_event_or_404(db, event_id)
    for existing in list(event.eligibilities):
        db.delete(existing)
    db.flush()
    if not rules:
        rules = [
            SimpleNamespace(
                eligibility_type=EligibilityType.ALL_STUDENTS,
                college_id=None,
                college=None,
                organization_id=None,
                organization=None,
            )
        ]
    for rule in rules:
        db.add(_create_eligibility(db, event, rule))
    write_audit_log(
        db,
        AuditAction.ELECTION_UPDATED,
        user_id=actor.id,
        event_id=event_id,
        entity_type="election_eligibility",
        entity_id=event_id,
        metadata={"action": "eligibility_replaced"},
    )
    db.commit()
    return get_election(db, event_id, current_user=actor)
