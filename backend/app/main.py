from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401
from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.routes import (
    analytics_route,
    auth_route,
    candidate_route,
    college_route,
    election_route,
    organization_route,
    result_route,
    user_route,
    vote_route,
)
from app.seed import seed_database


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.auto_create_tables:
        Base.metadata.create_all(bind=engine)
    if settings.seed_on_startup:
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_route.router, prefix=settings.api_prefix)
app.include_router(user_route.router, prefix=settings.api_prefix)
app.include_router(college_route.router, prefix=settings.api_prefix)
app.include_router(organization_route.router, prefix=settings.api_prefix)
app.include_router(election_route.router, prefix=settings.api_prefix)
app.include_router(candidate_route.router, prefix=settings.api_prefix)
app.include_router(vote_route.router, prefix=settings.api_prefix)
app.include_router(result_route.router, prefix=settings.api_prefix)
app.include_router(analytics_route.router, prefix=settings.api_prefix)


@app.get("/")
def root():
    return {"name": settings.app_name, "status": "ok"}


@app.get(f"{settings.api_prefix}/health")
def health():
    return {"status": "ok"}
