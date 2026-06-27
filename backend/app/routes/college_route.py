from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.college_schema import CollegeCreate, CollegeRead, CollegeUpdate
from app.security import require_roles
from app.services.reference_service import create_college, list_colleges, update_college
from app.utils.enums import UserRole

router = APIRouter(prefix="/colleges", tags=["colleges"])
admin_required = require_roles(UserRole.ADMIN, UserRole.ELECTION_MANAGER)


@router.get("", response_model=list[CollegeRead])
def colleges(db: Annotated[Session, Depends(get_db)]):
    return list_colleges(db)


@router.post("", response_model=CollegeRead, status_code=201)
def create(payload: CollegeCreate, db: Annotated[Session, Depends(get_db)], _: Annotated[object, Depends(admin_required)]):
    return create_college(db, payload)


@router.patch("/{college_id}", response_model=CollegeRead)
def update(
    college_id: int,
    payload: CollegeUpdate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[object, Depends(admin_required)],
):
    return update_college(db, college_id, payload)
