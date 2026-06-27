from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.analytics_schema import DashboardAnalytics, ElectionAnalytics
from app.security import require_roles
from app.services.analytics_service import dashboard_overview, election_analytics
from app.utils.enums import UserRole

router = APIRouter(prefix="/analytics", tags=["analytics"])
admin_required = require_roles(UserRole.ADMIN, UserRole.ELECTION_MANAGER)


@router.get("/overview", response_model=DashboardAnalytics)
def overview(db: Annotated[Session, Depends(get_db)], _: Annotated[object, Depends(admin_required)]):
    return dashboard_overview(db)


@router.get("/elections/{event_id}", response_model=ElectionAnalytics)
def election(event_id: int, db: Annotated[Session, Depends(get_db)], _: Annotated[object, Depends(admin_required)]):
    return election_analytics(db, event_id)
