from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user_schema import UserStatusUpdate, UserUpdate
from app.services.audit_service import write_audit_log
from app.services.auth_service import create_user
from app.services.helpers import get_college_by_ref, get_organization_by_ref, serialize_user, split_full_name
from app.utils.enums import AuditAction


def list_users(db: Session, search: str | None = None) -> list[dict]:
    stmt = select(User).order_by(User.created_at.desc())
    if search:
        needle = f"%{search}%"
        stmt = stmt.where(
            or_(
                User.first_name.ilike(needle),
                User.last_name.ilike(needle),
                User.email.ilike(needle),
                User.student_number.ilike(needle),
            )
        )
    return [serialize_user(user) for user in db.scalars(stmt).all()]


def get_user_or_404(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def update_user(db: Session, user_id: int, payload: UserUpdate, actor_id: int | None = None) -> dict:
    user = get_user_or_404(db, user_id)
    data = payload.model_dump(exclude_unset=True)
    if "full_name" in data and data["full_name"]:
        user.first_name, user.middle_name, user.last_name = split_full_name(data.pop("full_name"))
    if "college" in data or "college_id" in data:
        college = get_college_by_ref(db, data.pop("college_id", None), data.pop("college", None))
        if college is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="College not found")
        user.college_id = college.id
    if "organization" in data or "organization_id" in data:
        organization = get_organization_by_ref(db, data.pop("organization_id", None), data.pop("organization", None))
        user.organization_id = organization.id if organization else None
    for key, value in data.items():
        if key == "email" and value is not None:
            value = str(value).lower()
        setattr(user, key, value)
    write_audit_log(
        db,
        AuditAction.USER_STATUS_UPDATED,
        user_id=actor_id,
        entity_type="user",
        entity_id=user.id,
        metadata={"updated_user_id": user.id},
    )
    db.commit()
    db.refresh(user)
    return serialize_user(user)


def update_user_status(db: Session, user_id: int, payload: UserStatusUpdate, actor_id: int | None = None) -> dict:
    user = get_user_or_404(db, user_id)
    user.status = payload.status
    write_audit_log(
        db,
        AuditAction.USER_STATUS_UPDATED,
        user_id=actor_id,
        entity_type="user",
        entity_id=user.id,
        metadata={"status": payload.status.value},
    )
    db.commit()
    db.refresh(user)
    return serialize_user(user)


__all__ = ["create_user", "list_users", "update_user", "update_user_status"]
