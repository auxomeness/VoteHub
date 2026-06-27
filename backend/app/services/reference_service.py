from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.college import College
from app.models.organization import Organization
from app.models.user import User
from app.schemas.college_schema import CollegeCreate, CollegeUpdate
from app.schemas.organization_schema import OrganizationCreate, OrganizationUpdate


def list_colleges(db: Session) -> list[College]:
    return db.scalars(select(College).order_by(College.abbreviation)).all()


def create_college(db: Session, payload: CollegeCreate) -> College:
    college = College(**payload.model_dump())
    db.add(college)
    db.commit()
    db.refresh(college)
    return college


def update_college(db: Session, college_id: int, payload: CollegeUpdate) -> College:
    college = db.get(College, college_id)
    if college is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="College not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(college, key, value)
    db.commit()
    db.refresh(college)
    return college


def list_organizations(db: Session) -> list[dict]:
    rows = db.execute(
        select(Organization, func.count(User.id))
        .outerjoin(User, User.organization_id == Organization.id)
        .group_by(Organization.id)
        .order_by(Organization.name)
    ).all()
    return [
        {
            "id": org.id,
            "name": org.name,
            "description": org.description,
            "status": org.status,
            "created_at": org.created_at,
            "updated_at": org.updated_at,
            "member_count": count,
        }
        for org, count in rows
    ]


def create_organization(db: Session, payload: OrganizationCreate) -> Organization:
    organization = Organization(**payload.model_dump())
    db.add(organization)
    db.commit()
    db.refresh(organization)
    return organization


def update_organization(db: Session, organization_id: int, payload: OrganizationUpdate) -> Organization:
    organization = db.get(Organization, organization_id)
    if organization is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(organization, key, value)
    db.commit()
    db.refresh(organization)
    return organization


def delete_organization(db: Session, organization_id: int) -> None:
    organization = db.get(Organization, organization_id)
    if organization is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    db.delete(organization)
    db.commit()
