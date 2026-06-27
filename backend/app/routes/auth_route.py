from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.schemas.user_schema import Token, UserLogin, UserRead, UserRegister
from app.security import get_current_user
from app.services.auth_service import login, register_student
from app.services.helpers import serialize_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=201)
def register(payload: UserRegister, db: Annotated[Session, Depends(get_db)]):
    user = register_student(db, payload)
    return serialize_user(user)


@router.post("/login", response_model=Token)
def login_user(payload: UserLogin, db: Annotated[Session, Depends(get_db)]):
    settings = get_settings()
    return login(db, payload, settings.access_token_expire_minutes)


@router.get("/me", response_model=UserRead)
def me(current_user=Depends(get_current_user)):
    return serialize_user(current_user)
