from datetime import datetime

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.college import College
from app.models.election import VotingEvent
from app.models.organization import Organization
from app.utils.datetime import ensure_aware, utcnow
from app.utils.enums import (
    ElectionStatus,
    ElectionType,
    EligibilityType,
    PartialResultType,
    ResultVisibility,
)


def split_full_name(full_name: str) -> tuple[str, str | None, str]:
    parts = [part.strip() for part in full_name.strip().split() if part.strip()]
    if len(parts) == 1:
        return parts[0], None, ""
    if len(parts) == 2:
        return parts[0], None, parts[1]
    return parts[0], " ".join(parts[1:-1]), parts[-1]


def get_college_by_ref(db: Session, college_id: int | None = None, college: str | None = None) -> College | None:
    if college_id is not None:
        return db.get(College, college_id)
    if not college:
        return None
    key = college.strip()
    return db.scalar(
        select(College).where(or_(College.abbreviation.ilike(key), College.name.ilike(key)))
    )


def get_organization_by_ref(
    db: Session,
    organization_id: int | None = None,
    organization: str | None = None,
) -> Organization | None:
    if organization_id is not None:
        return db.get(Organization, organization_id)
    if not organization:
        return None
    key = organization.strip()
    return db.scalar(select(Organization).where(Organization.name.ilike(key)))


def event_status(event: VotingEvent, now: datetime | None = None) -> ElectionStatus:
    if event.status == ElectionStatus.ARCHIVED:
        return ElectionStatus.ARCHIVED
    current = now or utcnow()
    start = ensure_aware(event.start_date)
    end = ensure_aware(event.end_date)
    if current < start:
        return ElectionStatus.UPCOMING
    if current > end:
        return ElectionStatus.CLOSED
    return ElectionStatus.ACTIVE


def is_event_active(event: VotingEvent) -> bool:
    return event_status(event) == ElectionStatus.ACTIVE


def election_type_label(value: ElectionType) -> str:
    return {
        ElectionType.UNIVERSITY: "University-Wide",
        ElectionType.COLLEGE: "College",
        ElectionType.ORGANIZATION: "Organization",
        ElectionType.SPECIAL: "Special",
    }[value]


def result_visibility_label(value: ResultVisibility) -> str:
    return {
        ResultVisibility.LIVE: "Live Results",
        ResultVisibility.HIDDEN: "Hidden Results",
        ResultVisibility.SCHEDULED: "Scheduled Release",
        ResultVisibility.PARTIAL: "Partial Results",
        ResultVisibility.MANUAL: "Manual Release",
    }[value]


def partial_result_label(value: PartialResultType | None) -> str | None:
    if value is None:
        return None
    return {
        PartialResultType.TURNOUT_ONLY: "Turnout Only",
        PartialResultType.PERCENTAGE_ONLY: "Percentage Only",
        PartialResultType.RANKING_ONLY: "Ranking Only",
    }[value]


def format_date(value: datetime) -> str:
    return ensure_aware(value).strftime("%b %d, %Y")


def eligibility_label(event: VotingEvent) -> str:
    rules = event.eligibilities
    if not rules:
        return "All Students"
    if any(rule.eligibility_type == EligibilityType.ALL_STUDENTS for rule in rules):
        return "All Students"
    college_names = sorted(
        {
            rule.college.abbreviation
            for rule in rules
            if rule.college is not None and rule.eligibility_type in {EligibilityType.COLLEGE_ONLY, EligibilityType.CUSTOM}
        }
    )
    org_names = sorted(
        {
            rule.organization.name
            for rule in rules
            if rule.organization is not None
            and rule.eligibility_type in {EligibilityType.ORGANIZATION_ONLY, EligibilityType.CUSTOM}
        }
    )
    parts: list[str] = []
    if college_names:
        parts.append(", ".join(college_names) + " Students")
    if org_names:
        parts.append(", ".join(org_names) + " Members")
    return " / ".join(parts) if parts else "Custom"


def serialize_candidate(candidate) -> dict:
    college = candidate.college.abbreviation if candidate.college else None
    organization = candidate.organization.name if candidate.organization else None
    return {
        "id": candidate.id,
        "position_id": candidate.position_id,
        "name": candidate.name,
        "photo": candidate.photo,
        "course": candidate.course,
        "college_id": candidate.college_id,
        "college": college,
        "org": organization,
        "organization_id": candidate.organization_id,
        "organization": organization,
        "platform": candidate.platform,
        "biography": candidate.biography,
        "status": candidate.status,
        "created_at": candidate.created_at,
    }


def serialize_position(position, include_candidates: bool = True) -> dict:
    return {
        "id": position.id,
        "event_id": position.event_id,
        "name": position.name,
        "title": position.name,
        "position_scope": position.position_scope,
        "college_id": position.college_id,
        "college": position.college.abbreviation if position.college else None,
        "organization_id": position.organization_id,
        "organization": position.organization.name if position.organization else None,
        "max_selection": position.max_selection,
        "display_order": position.display_order,
        "candidates": [serialize_candidate(candidate) for candidate in position.candidates] if include_candidates else [],
    }


def serialize_user(user) -> dict:
    return {
        "id": user.id,
        "student_number": user.student_number,
        "first_name": user.first_name,
        "middle_name": user.middle_name,
        "last_name": user.last_name,
        "full_name": user.full_name,
        "email": user.email,
        "college_id": user.college_id,
        "college": user.college.name if user.college else None,
        "college_abbreviation": user.college.abbreviation if user.college else None,
        "organization_id": user.organization_id,
        "organization": user.organization.name if user.organization else None,
        "program": user.program,
        "year_level": user.year_level,
        "role": user.role,
        "status": user.status,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }
