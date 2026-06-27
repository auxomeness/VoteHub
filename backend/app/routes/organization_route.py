from typing import Annotated

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.organization_schema import OrganizationCreate, OrganizationRead, OrganizationUpdate
from app.security import require_roles
from app.services.reference_service import create_organization, delete_organization, list_organizations, update_organization
from app.utils.enums import UserRole

router = APIRouter(prefix="/organizations", tags=["organizations"])
admin_required = require_roles(UserRole.ADMIN, UserRole.ELECTION_MANAGER)


@router.get("", response_model=list[OrganizationRead])
def organizations(db: Annotated[Session, Depends(get_db)]):
    return list_organizations(db)


@router.post("", response_model=OrganizationRead, status_code=201)
def create(
    payload: OrganizationCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[object, Depends(admin_required)],
):
    organization = create_organization(db, payload)
    return {**organization.__dict__, "member_count": 0}


@router.patch("/{organization_id}", response_model=OrganizationRead)
def update(
    organization_id: int,
    payload: OrganizationUpdate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[object, Depends(admin_required)],
):
    organization = update_organization(db, organization_id, payload)
    return {**organization.__dict__, "member_count": 0}


@router.delete("/{organization_id}", status_code=204)
def delete(
    organization_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[object, Depends(admin_required)],
):
    delete_organization(db, organization_id)
    return Response(status_code=204)
