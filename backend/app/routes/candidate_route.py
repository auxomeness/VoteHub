from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.candidate_schema import CandidateCreate, CandidateRead, CandidateUpdate
from app.security import require_active_user, require_roles
from app.services.candidate_service import create_candidate, delete_candidate, list_candidates, update_candidate
from app.utils.enums import UserRole

router = APIRouter(prefix="/candidates", tags=["candidates"])
admin_required = require_roles(UserRole.ADMIN, UserRole.ELECTION_MANAGER)


@router.get("", response_model=list[CandidateRead])
def candidates(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[object, Depends(require_active_user)],
    event_id: int | None = Query(default=None),
    position_id: int | None = Query(default=None),
):
    return list_candidates(db, event_id=event_id, position_id=position_id)


@router.post("", response_model=CandidateRead, status_code=201)
def create(payload: CandidateCreate, db: Annotated[Session, Depends(get_db)], current_user=Depends(admin_required)):
    return create_candidate(db, payload, current_user)


@router.patch("/{candidate_id}", response_model=CandidateRead)
def update(
    candidate_id: int,
    payload: CandidateUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(admin_required),
):
    return update_candidate(db, candidate_id, payload, current_user)


@router.delete("/{candidate_id}", status_code=204)
def delete(candidate_id: int, db: Annotated[Session, Depends(get_db)], current_user=Depends(admin_required)):
    delete_candidate(db, candidate_id, current_user)
    return Response(status_code=204)
