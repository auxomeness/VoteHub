from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user_schema import UserCreate, UserRead, UserStatusUpdate, UserUpdate
from app.security import require_roles
from app.services.auth_service import create_user
from app.services.helpers import serialize_user
from app.services.user_service import list_users, update_user, update_user_status
from app.utils.enums import UserRole

router = APIRouter(prefix="/users", tags=["users"])
admin_required = require_roles(UserRole.ADMIN, UserRole.ELECTION_MANAGER)


@router.get("", response_model=list[UserRead])
def users(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[object, Depends(admin_required)],
    search: str | None = Query(default=None),
):
    return list_users(db, search)


@router.post("", response_model=UserRead, status_code=201)
def create(
    payload: UserCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[object, Depends(admin_required)],
):
    return serialize_user(create_user(db, payload))


@router.patch("/{user_id}", response_model=UserRead)
def update(
    user_id: int,
    payload: UserUpdate,
    db: Annotated[Session, Depends(get_db)],
    actor=Depends(admin_required),
):
    return update_user(db, user_id, payload, actor_id=actor.id)


@router.patch("/{user_id}/status", response_model=UserRead)
def status_update(
    user_id: int,
    payload: UserStatusUpdate,
    db: Annotated[Session, Depends(get_db)],
    actor=Depends(admin_required),
):
    return update_user_status(db, user_id, payload, actor_id=actor.id)
