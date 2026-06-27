from collections import defaultdict
from uuid import uuid4

from fastapi import HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models.candidate import Candidate
from app.models.election import VotingEvent
from app.models.position import Position
from app.models.user import User
from app.models.vote import VoteDetail, VoteRecord
from app.schemas.vote_schema import VoteSubmit
from app.services.audit_service import write_audit_log
from app.services.eligibility_service import is_user_eligible
from app.services.helpers import event_status, is_event_active
from app.utils.enums import AuditAction, CandidateStatus, UserRole


def vote_status(db: Session, event_id: int, current_user: User) -> dict:
    event = db.scalar(select(VotingEvent).where(VotingEvent.id == event_id))
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Election not found")
    has_voted = (
        db.scalar(
            select(func.count(VoteRecord.id)).where(
                VoteRecord.event_id == event_id,
                VoteRecord.user_id == current_user.id,
            )
        )
        or 0
    ) > 0
    return {
        "event_id": event_id,
        "eligible": is_user_eligible(current_user, event),
        "has_voted": has_voted,
        "status": event_status(event).value.lower(),
    }


def _validate_position_scope(position: Position, current_user: User) -> None:
    if position.college_id is not None and position.college_id != current_user.college_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Not eligible for {position.name}")
    if position.organization_id is not None and position.organization_id != current_user.organization_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Not eligible for {position.name}")


def submit_vote(db: Session, payload: VoteSubmit, current_user: User, request: Request | None = None) -> dict:
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students may vote")

    try:
        event = db.scalar(
            select(VotingEvent)
            .where(VotingEvent.id == payload.event_id)
            .options(
                selectinload(VotingEvent.eligibilities),
                selectinload(VotingEvent.positions).selectinload(Position.candidates),
            )
            .with_for_update()
        )
        if event is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Election not found")
        if not is_event_active(event):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Election is not currently active")
        if not is_user_eligible(current_user, event):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not eligible for this election")

        already_voted = (
            db.scalar(
                select(func.count(VoteRecord.id)).where(
                    VoteRecord.event_id == event.id,
                    VoteRecord.user_id == current_user.id,
                )
            )
            or 0
        ) > 0
        if already_voted:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You have already voted in this election")

        positions = {position.id: position for position in event.positions}
        selections_by_position: dict[int, list[tuple[int | None, bool]]] = defaultdict(list)
        seen: set[tuple[int, int | str]] = set()

        for selection in payload.selections:
            position = positions.get(selection.position_id)
            if position is None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected position is not part of this election")
            _validate_position_scope(position, current_user)

            marker: int | str = "ABSTAIN" if selection.is_abstain else int(selection.candidate_id or 0)
            key = (position.id, marker)
            if key in seen:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Duplicate selection detected")
            seen.add(key)
            selections_by_position[position.id].append((selection.candidate_id, selection.is_abstain))

        for position_id, selections in selections_by_position.items():
            position = positions[position_id]
            abstain_count = sum(1 for _, is_abstain in selections if is_abstain)
            if abstain_count and len(selections) > 1:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot abstain and select candidates for {position.name}")
            if len(selections) > position.max_selection:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{position.name} allows at most {position.max_selection} selection(s)",
                )
            candidate_ids = [candidate_id for candidate_id, is_abstain in selections if not is_abstain and candidate_id is not None]
            if candidate_ids:
                valid_candidates = {
                    candidate.id: candidate
                    for candidate in db.scalars(
                        select(Candidate).where(
                            Candidate.id.in_(candidate_ids),
                            Candidate.position_id == position_id,
                            Candidate.status == CandidateStatus.ACTIVE,
                        )
                    ).all()
                }
                if len(valid_candidates) != len(candidate_ids):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid candidate selection for {position.name}",
                    )

        vote = VoteRecord(user_id=current_user.id, event_id=event.id)
        db.add(vote)
        db.flush()

        for position_id, selections in selections_by_position.items():
            for candidate_id, is_abstain in selections:
                db.add(
                    VoteDetail(
                        vote_id=vote.id,
                        position_id=position_id,
                        candidate_id=None if is_abstain else candidate_id,
                        is_abstain=is_abstain,
                    )
                )

        ip_address = request.client.host if request and request.client else None
        user_agent = request.headers.get("user-agent") if request else None
        write_audit_log(
            db,
            AuditAction.VOTE_SUBMITTED,
            user_id=current_user.id,
            event_id=event.id,
            entity_type="vote",
            entity_id=vote.id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"position_count": len(selections_by_position)},
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Vote could not be recorded; duplicate vote detected") from exc
    except HTTPException:
        db.rollback()
        raise

    db.refresh(vote)
    return {
        "vote_id": vote.id,
        "event_id": event.id,
        "receipt_code": f"VH-{event.id}-{vote.id}-{uuid4().hex[:8].upper()}",
        "submitted_at": vote.submitted_at,
    }
