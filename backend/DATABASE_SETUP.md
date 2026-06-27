# Backend Database Connection Guide

This backend is designed to connect FastAPI and SQLAlchemy directly to Supabase PostgreSQL. The frontend should call the FastAPI API only; it should not insert votes directly into Supabase.

## 1. Create or Open the Supabase Project

1. Open your Supabase project.
2. Go to the database connection settings.
3. Copy the PostgreSQL connection URI.

For migrations, prefer the direct database URI. For deployed runtime traffic, Supabase's pooled URI can also work, but migrations are usually safer against the direct connection.

## 2. Configure `backend/.env`

From the backend folder:

```powershell
cd backend
Copy-Item .env.example .env
```

Edit `backend/.env`:

```env
APP_NAME="ADNU VoteHub API"
API_PREFIX="/api"

DATABASE_URL="postgresql+psycopg://postgres:<password>@<host>:5432/postgres"

SECRET_KEY="<generate-a-long-random-secret>"
ACCESS_TOKEN_EXPIRE_MINUTES=120

ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"

AUTO_CREATE_TABLES=false
SEED_ON_STARTUP=false
```

Notes:

- `postgresql://...` and `postgres://...` URLs are accepted by the app, but `postgresql+psycopg://...` is the clearest SQLAlchemy driver format.
- Keep `AUTO_CREATE_TABLES=false` for Supabase. Use Alembic migrations instead.
- Keep `.env` private. Do not commit it.
- Use a strong `SECRET_KEY` before real testing with users.

## 3. Install Backend Dependencies

Use the virtual environment that already exists in the backend folder:

```powershell
cd backend
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```

## 4. Run Migrations

Apply the schema to Supabase:

```powershell
cd backend
.\venv\Scripts\python.exe -m alembic upgrade head
```

This creates the core tables and voting integrity constraints, including:

- `UNIQUE (user_id, event_id)` on `votes`
- `UNIQUE (vote_id, position_id, candidate_id)` on `vote_details`
- foreign keys for users, elections, positions, candidates, vote records, and audit logs

## 5. Optional Seed Data

For development only, set this temporarily in `backend/.env`:

```env
SEED_ON_STARTUP=true
```

Then start the API once. After the seed completes, set it back to:

```env
SEED_ON_STARTUP=false
```

Seed accounts:

- Admin: `admin@adnu.edu.ph` / `admin12345`
- Student: `maria.santos@gbox.adnu.edu.ph` / `password123`

## 6. Run the Backend

```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Check:

- `http://localhost:8000/api/health`
- `http://localhost:8000/docs`

## 7. Connect the Frontend

Create `frontend/.env` if it does not exist:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Then run the frontend as usual. The API client in `frontend/src/app/lib/api.ts` uses `VITE_API_BASE_URL` and stores the JWT access token in local storage after login.

## 8. Troubleshooting

- If migrations cannot connect, confirm the Supabase database password, host, port, and project network access.
- If authentication works but browser calls fail, confirm `ALLOWED_ORIGINS` includes the frontend dev server URL.
- If vote submission fails with duplicate-vote errors, the database constraint is working: the same user cannot vote twice in the same election.
- If candidates or colleges are rejected, make sure seed/reference data exists and names or abbreviations match the backend reference rows.
- Do not use the Supabase anon key to write votes from the frontend. Vote submission must go through `POST /api/votes/submit` so authentication, eligibility, candidate validation, audit logging, and transaction safety all happen server-side.
