from collections import defaultdict

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.college import College
from app.models.election import VotingEvent
from app.models.organization import Organization
from app.models.user import User
from app.models.vote import VoteRecord
from app.services.eligibility_service import eligible_users
from app.services.election_service import get_event_or_404
from app.services.helpers import event_status
from app.utils.datetime import ensure_aware
from app.utils.enums import ElectionStatus, UserRole, UserStatus


def dashboard_overview(db: Session) -> dict:
    total_students = db.scalar(select(func.count(User.id)).where(User.role == UserRole.STUDENT)) or 0
    active_students = (
        db.scalar(select(func.count(User.id)).where(User.role == UserRole.STUDENT, User.status == UserStatus.ACTIVE))
        or 0
    )
    events = db.scalars(select(VotingEvent)).all()
    active_elections = sum(1 for event in events if event_status(event) == ElectionStatus.ACTIVE)
    votes_cast = db.scalar(select(func.count(VoteRecord.id))) or 0
    participation_rate = round((votes_cast / active_students) * 100, 1) if active_students else 0.0
    return {
        "total_students": total_students,
        "active_students": active_students,
        "total_elections": len(events),
        "active_elections": active_elections,
        "votes_cast": votes_cast,
        "participation_rate": participation_rate,
    }


def _bucket(label: str, eligible: int, votes: int) -> dict:
    return {"label": label, "eligible": eligible, "votes": votes, "rate": round((votes / eligible) * 100, 1) if eligible else 0.0}


def election_analytics(db: Session, event_id: int) -> dict:
    event = get_event_or_404(db, event_id)
    eligible = eligible_users(db, event)
    voter_ids = set(db.scalars(select(VoteRecord.user_id).where(VoteRecord.event_id == event.id)).all())

    by_college_counts: dict[str, list[int]] = defaultdict(lambda: [0, 0])
    by_year_counts: dict[str, list[int]] = defaultdict(lambda: [0, 0])
    by_org_counts: dict[str, list[int]] = defaultdict(lambda: [0, 0])

    for user in eligible:
        voted = 1 if user.id in voter_ids else 0
        college_label = user.college.abbreviation if user.college else "Unassigned"
        year_label = user.year_level or "Unspecified"
        org_label = user.organization.name if user.organization else "No Organization"
        for counts in (by_college_counts[college_label], by_year_counts[year_label], by_org_counts[org_label]):
            counts[0] += 1
            counts[1] += voted

    hourly_rows = db.scalars(select(VoteRecord).where(VoteRecord.event_id == event.id).order_by(VoteRecord.submitted_at)).all()
    hourly_counts: dict[str, int] = defaultdict(int)
    for vote in hourly_rows:
        label = ensure_aware(vote.submitted_at).strftime("%b %d %I %p").replace(" 0", " ")
        hourly_counts[label] += 1
    cumulative = 0
    hourly = []
    for label, votes in hourly_counts.items():
        cumulative += votes
        hourly.append({"label": label, "votes": votes, "cumulative": cumulative})

    summary = dashboard_overview(db)
    summary["votes_cast"] = len(voter_ids)
    summary["participation_rate"] = round((len(voter_ids) / len(eligible)) * 100, 1) if eligible else 0.0
    return {
        "event_id": event.id,
        "summary": summary,
        "by_college": [_bucket(label, counts[0], counts[1]) for label, counts in sorted(by_college_counts.items())],
        "by_year_level": [_bucket(label, counts[0], counts[1]) for label, counts in sorted(by_year_counts.items())],
        "by_organization": [_bucket(label, counts[0], counts[1]) for label, counts in sorted(by_org_counts.items())],
        "hourly_votes": hourly,
    }
