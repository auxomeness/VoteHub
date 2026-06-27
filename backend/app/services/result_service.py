from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.candidate import Candidate
from app.models.election import VotingEvent
from app.models.position import Position
from app.models.user import User
from app.models.vote import VoteDetail, VoteRecord
from app.services.election_service import get_event_or_404, serialize_event
from app.services.helpers import event_status
from app.utils.datetime import ensure_aware, utcnow
from app.utils.enums import ElectionStatus, PartialResultType, ResultVisibility, UserRole


RESULT_COLORS = ["#2563EB", "#0A2540", "#7C3AED", "#059669", "#D97706", "#DC2626", "#0891B2"]


def can_view_results(event: VotingEvent, current_user: User) -> bool:
    if current_user.role == UserRole.ADMIN:
        return True
    status_value = event_status(event)
    if event.result_visibility == ResultVisibility.LIVE:
        return True
    if event.result_visibility == ResultVisibility.HIDDEN:
        return status_value == ElectionStatus.CLOSED
    if event.result_visibility == ResultVisibility.SCHEDULED:
        return event.result_release_date is not None and utcnow() >= ensure_aware(event.result_release_date)
    if event.result_visibility == ResultVisibility.PARTIAL:
        return True
    if event.result_visibility == ResultVisibility.MANUAL:
        return event.results_published_at is not None
    return False


def get_results(db: Session, event_id: int, current_user: User) -> dict:
    event = get_event_or_404(db, event_id)
    summary = serialize_event(db, event, current_user=current_user)
    visible = can_view_results(event, current_user)
    result = {
        "event_id": event.id,
        "visible": visible,
        "mode": event.result_visibility.value,
        "partial_result_type": event.partial_result_type.value if event.partial_result_type else None,
        "summary": summary,
        "positions": [],
    }
    if not visible:
        return result
    if event.result_visibility == ResultVisibility.PARTIAL and event.partial_result_type == PartialResultType.TURNOUT_ONLY:
        return result

    for position in sorted(event.positions, key=lambda item: (item.display_order, item.id)):
        position_total = (
            db.scalar(
                select(func.count(VoteDetail.id))
                .join(VoteRecord, VoteRecord.id == VoteDetail.vote_id)
                .where(VoteRecord.event_id == event.id, VoteDetail.position_id == position.id)
            )
            or 0
        )
        rows = []
        for index, candidate in enumerate(position.candidates):
            votes = (
                db.scalar(
                    select(func.count(VoteDetail.id)).where(
                        VoteDetail.position_id == position.id,
                        VoteDetail.candidate_id == candidate.id,
                    )
                )
                or 0
            )
            percentage = round((votes / position_total) * 100, 1) if position_total else 0
            rows.append(
                {
                    "candidate_id": candidate.id,
                    "name": candidate.name,
                    "votes": votes,
                    "percentage": percentage,
                    "color": RESULT_COLORS[index % len(RESULT_COLORS)],
                }
            )
        abstain_votes = (
            db.scalar(
                select(func.count(VoteDetail.id))
                .join(VoteRecord, VoteRecord.id == VoteDetail.vote_id)
                .where(
                    VoteRecord.event_id == event.id,
                    VoteDetail.position_id == position.id,
                    VoteDetail.is_abstain.is_(True),
                )
            )
            or 0
        )
        if abstain_votes:
            rows.append(
                {
                    "candidate_id": None,
                    "name": "Abstain",
                    "votes": abstain_votes,
                    "percentage": round((abstain_votes / position_total) * 100, 1) if position_total else 0,
                    "color": "#94A3B8",
                }
            )
        if event.result_visibility == ResultVisibility.PARTIAL and event.partial_result_type == PartialResultType.PERCENTAGE_ONLY:
            for row in rows:
                row["votes"] = 0
        result["positions"].append({"position": position.name, "position_id": position.id, "data": rows})
    return result


def publish_results(db: Session, event_id: int, current_user: User) -> dict:
    event = db.get(VotingEvent, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Election not found")
    event.results_published_at = utcnow()
    db.commit()
    return get_results(db, event_id, current_user)
