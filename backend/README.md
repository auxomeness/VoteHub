# VoteHub Backend

FastAPI backend for ADNU VoteHub.

## Stack

- FastAPI
- SQLAlchemy 2.x
- Alembic
- Supabase PostgreSQL
- JWT bearer authentication
- Passlib bcrypt password hashing

## Setup

```powershell
cd backend
.\venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` and set:

```env
DATABASE_URL="postgresql+psycopg://postgres:<password>@<host>:5432/postgres"
SECRET_KEY="<strong-secret>"
ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
```

For quick local SQLite development, keep the default `sqlite:///./votehub_dev.db`.

For the full Supabase connection walkthrough, see [DATABASE_SETUP.md](DATABASE_SETUP.md).

## Migrations

```powershell
cd backend
.\venv\Scripts\python.exe -m alembic upgrade head
```

The initial migration creates:

- users, colleges, organizations
- voting_events, positions, candidates
- election_eligibilities
- votes and vote_details
- audit_logs

Voting integrity constraints include:

- `UNIQUE (user_id, event_id)` on `votes`
- `UNIQUE (vote_id, position_id, candidate_id)` on `vote_details`
- foreign keys from vote details to votes, positions, and candidates
- foreign keys from votes to users and voting events

## Seed Data

Set this in `.env` for a one-time local seed while starting the API:

```env
SEED_ON_STARTUP=true
```

Seed accounts:

- Admin: `admin@adnu.edu.ph` / `admin12345`
- Student: `maria.santos@gbox.adnu.edu.ph` / `password123`

Turn `SEED_ON_STARTUP` back to `false` after seeding.

## Run

```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

API docs:

- `http://localhost:8000/docs`
- `http://localhost:8000/api/health`

## Core Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/elections`
- `POST /api/elections`
- `GET /api/elections/{event_id}/ballot`
- `POST /api/votes/submit`
- `GET /api/results/{event_id}`
- `GET /api/analytics/overview`
- `GET /api/analytics/elections/{event_id}`

## Protected Vote Flow

`POST /api/votes/submit` performs all critical checks server-side:

1. Authenticated active student
2. Election exists
3. Election is currently active
4. Voter is eligible
5. Voter has not already voted
6. Selected candidates belong to the selected positions
7. Position `max_selection` is enforced
8. Vote record is inserted
9. Vote details are inserted
10. Audit log is written
11. Everything commits in one transaction
