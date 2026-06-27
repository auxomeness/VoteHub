from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.vote_schema import VoteReceipt, VoteStatusRead, VoteSubmit
from app.security import require_active_user
from app.services.vote_service import submit_vote, vote_status

router = APIRouter(prefix="/votes", tags=["votes"])


@router.get("/status/{event_id}", response_model=VoteStatusRead)
def status(event_id: int, db: Annotated[Session, Depends(get_db)], current_user=Depends(require_active_user)):
    return vote_status(db, event_id, current_user)


@router.post("/submit", response_model=VoteReceipt, status_code=201)
def submit(
    payload: VoteSubmit,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    current_user=Depends(require_active_user),
):
    return submit_vote(db, payload, current_user, request)
