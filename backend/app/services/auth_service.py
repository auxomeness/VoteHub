from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user_schema import UserCreate, UserLogin, UserRegister
from app.security import create_access_token, get_password_hash, verify_password
from app.services.audit_service import write_audit_log
from app.services.helpers import get_college_by_ref, get_organization_by_ref, serialize_user, split_full_name
from app.utils.enums import AuditAction, UserRole, UserStatus


ADNU_STUDENT_DOMAIN = "@gbox.adnu.edu.ph"


def _create_user(db: Session, payload: UserRegister | UserCreate, *, require_adnu_email: bool) -> User:
    email = str(payload.email).lower()
    if require_adnu_email and not email.endswith(ADNU_STUDENT_DOMAIN):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Students must register with a @gbox.adnu.edu.ph email address",
        )

    college = get_college_by_ref(db, payload.college_id, payload.college)
    if college is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="College not found")

    organization = get_organization_by_ref(db, payload.organization_id, payload.organization)
    first_name, middle_name, last_name = split_full_name(payload.full_name)
    password = payload.password or "VoteHub@12345"
    role = getattr(payload, "role", UserRole.STUDENT)
    provided_status = getattr(payload, "status", None)
    status_value = provided_status or (UserStatus.ACTIVE if email.endswith(ADNU_STUDENT_DOMAIN) else UserStatus.PENDING)

    user = User(
        student_number=payload.student_number,
        first_name=first_name,
        middle_name=middle_name,
        last_name=last_name,
        email=email,
        password_hash=get_password_hash(password),
        college_id=college.id,
        organization_id=organization.id if organization else None,
        program=payload.program,
        year_level=payload.year_level,
        role=role,
        status=status_value,
    )
    db.add(user)
    try:
        db.flush()
        write_audit_log(
            db,
            AuditAction.USER_REGISTERED,
            user_id=user.id,
            entity_type="user",
            entity_id=user.id,
            metadata={"email": email, "auto_verified": status_value == UserStatus.ACTIVE},
        )
        if status_value == UserStatus.ACTIVE:
            write_audit_log(db, AuditAction.USER_VERIFIED, user_id=user.id, entity_type="user", entity_id=user.id)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email or student number already exists") from exc
    db.refresh(user)
    return user


def register_student(db: Session, payload: UserRegister) -> User:
    return _create_user(db, payload, require_adnu_email=True)


def create_user(db: Session, payload: UserCreate) -> User:
    return _create_user(db, payload, require_adnu_email=False)


def authenticate_user(db: Session, payload: UserLogin) -> User:
    user = db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if user.status == UserStatus.SUSPENDED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is suspended")
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is pending approval")
    return user


def login(db: Session, payload: UserLogin, expires_minutes: int) -> dict:
    user = authenticate_user(db, payload)
    token = create_access_token(str(user.id), timedelta(minutes=expires_minutes))
    return {"access_token": token, "token_type": "bearer", "user": serialize_user(user)}
