from typing import Annotated

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.election_schema import ElectionCreate, ElectionRead, ElectionSummary, ElectionUpdate, EligibilityCreate, PositionCreate, PositionRead, PositionUpdate
from app.security import require_active_user, require_roles
from app.services.election_service import (
    add_position,
    create_election,
    delete_position,
    get_ballot,
    get_election,
    list_elections,
    replace_eligibility,
    update_election,
    update_position,
)
from app.utils.enums import UserRole

router = APIRouter(prefix="/elections", tags=["elections"])
admin_required = require_roles(UserRole.ADMIN, UserRole.ELECTION_MANAGER)


@router.get("", response_model=list[ElectionSummary])
def elections(db: Annotated[Session, Depends(get_db)], current_user=Depends(require_active_user)):
    return list_elections(db, current_user)


@router.post("", response_model=ElectionRead, status_code=201)
def create(
    payload: ElectionCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(admin_required),
):
    return create_election(db, payload, current_user)


@router.get("/{event_id}", response_model=ElectionRead)
def detail(event_id: int, db: Annotated[Session, Depends(get_db)], current_user=Depends(require_active_user)):
    return get_election(db, event_id, current_user)


@router.patch("/{event_id}", response_model=ElectionRead)
def update(
    event_id: int,
    payload: ElectionUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(admin_required),
):
    return update_election(db, event_id, payload, current_user)


@router.get("/{event_id}/ballot", response_model=ElectionRead)
def ballot(event_id: int, db: Annotated[Session, Depends(get_db)], current_user=Depends(require_active_user)):
    return get_ballot(db, event_id, current_user)


@router.post("/{event_id}/positions", response_model=PositionRead, status_code=201)
def create_position(
    event_id: int,
    payload: PositionCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(admin_required),
):
    return add_position(db, event_id, payload, current_user)


@router.patch("/{event_id}/positions/{position_id}", response_model=PositionRead)
def edit_position(
    event_id: int,
    position_id: int,
    payload: PositionUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(admin_required),
):
    return update_position(db, event_id, position_id, payload, current_user)


@router.delete("/{event_id}/positions/{position_id}", status_code=204)
def remove_position(
    event_id: int,
    position_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(admin_required),
):
    delete_position(db, event_id, position_id, current_user)
    return Response(status_code=204)


@router.put("/{event_id}/eligibility", response_model=ElectionRead)
def update_eligibility(
    event_id: int,
    payload: list[EligibilityCreate],
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(admin_required),
):
    return replace_eligibility(db, event_id, payload, current_user)
