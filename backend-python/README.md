# FastAPI backend (PostgreSQL)

The running API uses PostgreSQL through SQLAlchemy 2.x and Psycopg 3. MongoDB
is used only by the one-time copy and verification scripts. The API routes and
React JSON shapes remain unchanged.

## Ubuntu setup

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib python3-venv
sudo -u postgres createuser --pwprompt react_reg_user
sudo -u postgres createdb --owner=react_reg_user react_reg
cd backend-python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set a strong password in `DATABASE_URL` and copy the existing JWT secret into
`JWT_SECRET`. Keep `.env` private.

Apply the schema and start the API:

```bash
alembic upgrade head
uvicorn main:app --reload
```

## Future schema changes

After changing SQLAlchemy models, create and inspect a migration, then apply:

```bash
alembic revision --autogenerate -m "describe schema change"
alembic upgrade head
```

Alembic loads `DATABASE_URL` from `backend-python/.env`; never put credentials
in migration source.

## Data migrations

Create data migrations as normal Alembic revisions in `migrations/versions/`:

```bash
alembic revision -m "describe data change"
```

Put the data transformation in `upgrade()` and its reversal in `downgrade()`
when it is reversible. Use `op.execute()` with parameterized SQL or define the
minimal SQLAlchemy table objects needed by the migration. Avoid importing the
current application models: old revisions must remain usable after those models
change. Review the generated revision before applying it with `alembic upgrade
head`.
