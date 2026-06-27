from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.election import VotingEvent
from app.models.user import User
from app.utils.enums import EligibilityType, UserRole, UserStatus


def is_user_eligible(user: User, event: VotingEvent) -> bool:
    if user.role != UserRole.STUDENT or user.status != UserStatus.ACTIVE:
        return False

    rules = event.eligibilities
    if not rules:
        return True

    for rule in rules:
        if rule.eligibility_type == EligibilityType.ALL_STUDENTS:
            return True
        if rule.eligibility_type == EligibilityType.COLLEGE_ONLY and rule.college_id == user.college_id:
            return True
        if rule.eligibility_type == EligibilityType.ORGANIZATION_ONLY and rule.organization_id == user.organization_id:
            return True
        if rule.eligibility_type == EligibilityType.CUSTOM:
            college_matches = rule.college_id is None or rule.college_id == user.college_id
            org_matches = rule.organization_id is None or rule.organization_id == user.organization_id
            if college_matches and org_matches:
                return True
    return False


def eligible_users(db: Session, event: VotingEvent) -> list[User]:
    users = db.scalars(select(User).where(User.role == UserRole.STUDENT, User.status == UserStatus.ACTIVE)).all()
    return [user for user in users if is_user_eligible(user, event)]


def count_eligible_voters(db: Session, event: VotingEvent) -> int:
    return len(eligible_users(db, event))
