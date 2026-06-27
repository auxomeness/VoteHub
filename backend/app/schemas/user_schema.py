from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.utils.enums import UserRole, UserStatus


class UserRegister(BaseModel):
    full_name: str = Field(min_length=2, max_length=240)
    student_number: str = Field(min_length=3, max_length=64)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    college: str | None = None
    college_id: int | None = None
    organization: str | None = None
    organization_id: int | None = None
    program: str | None = None
    year_level: str | None = None

    @model_validator(mode="after")
    def require_college(self) -> "UserRegister":
        if not self.college and self.college_id is None:
            raise ValueError("college or college_id is required")
        return self


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=240)
    student_number: str = Field(min_length=3, max_length=64)
    email: EmailStr
    password: str | None = Field(default=None, min_length=8, max_length=128)
    college: str | None = None
    college_id: int | None = None
    organization: str | None = None
    organization_id: int | None = None
    program: str | None = None
    year_level: str | None = None
    role: UserRole = UserRole.STUDENT
    status: UserStatus = UserStatus.ACTIVE


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=240)
    student_number: str | None = Field(default=None, min_length=3, max_length=64)
    email: EmailStr | None = None
    college: str | None = None
    college_id: int | None = None
    organization: str | None = None
    organization_id: int | None = None
    program: str | None = None
    year_level: str | None = None
    role: UserRole | None = None
    status: UserStatus | None = None


class UserStatusUpdate(BaseModel):
    status: UserStatus


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_number: str
    first_name: str
    middle_name: str | None
    last_name: str
    full_name: str
    email: EmailStr
    college_id: int | None
    college: str | None
    college_abbreviation: str | None
    organization_id: int | None
    organization: str | None
    program: str | None
    year_level: str | None
    role: UserRole
    status: UserStatus
    created_at: datetime
    updated_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
