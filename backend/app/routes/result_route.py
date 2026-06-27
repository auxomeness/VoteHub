from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import require_active_user, require_roles
from app.services.result_service import get_results, publish_results
from app.utils.enums import UserRole

router = APIRouter(prefix="/results", tags=["results"])
admin_required = require_roles(UserRole.ADMIN, UserRole.ELECTION_MANAGER)


@router.get("/{event_id}")
def results(event_id: int, db: Annotated[Session, Depends(get_db)], current_user=Depends(require_active_user)):
    return get_results(db, event_id, current_user)


@router.post("/{event_id}/publish")
def publish(event_id: int, db: Annotated[Session, Depends(get_db)], current_user=Depends(admin_required)):
    return publish_results(db, event_id, current_user)
