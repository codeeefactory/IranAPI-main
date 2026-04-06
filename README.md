# IranAPI

IranAPI is a Django REST + React/Vite API vault and independent developer portal with Persian/Farsi and RTL support.

This version runs on a MongoDB-backed backend. Active persistence no longer relies on Django ORM models, Django auth tables, or relational migrations.

## Stack

- Backend: Django 5.2, Django REST Framework, PyMongo
- Frontend: React 18, TypeScript, Vite, React Query
- Database: MongoDB
- Test database mode: `mongomock` during `python manage.py test`

## Repository Layout

```text
IranAPIBackend/        Django project settings
api/                   Mongo-backed API layer, repositories, auth, tests
api-hub-express/       React + TypeScript frontend
docs/                  Project diagrams and supporting documentation
docker/                Container entrypoints
Dockerfile             Canonical multi-stage Dockerfile with frontend/backend/app targets
docker-compose.yml     Production-like Docker stack
docker-compose.dev.yml Live-reload Docker development stack
```

## Local Development

### 1. Backend

Copy backend environment variables:

```bash
cp .env.example .env
```

Start MongoDB locally, then run:

```bash
python -m pip install -r requirements.txt
python manage.py runserver
```

Canonical backend API base URL: `http://localhost:8000/api/v1`

Legacy compatibility routes remain available under `http://localhost:8000/api`, but they are deprecated and return deprecation metadata.

### 2. Frontend

```bash
cd api-hub-express
cp .env.example .env
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

The frontend defaults to `/api/v1` and Vite proxies `/api`, `/static`, and `/media` to the backend target.

## MongoDB Configuration

Backend environment variables:

```bash
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=iranapi
MONGODB_USE_MOCK=false
API_ANON_THROTTLE_RATE=600/minute
API_USER_THROTTLE_RATE=1200/minute
```

`MONGODB_USE_MOCK` should stay `false` for normal development and deployment. The test runner enables mock-backed execution automatically so backend tests stay hermetic.
Throttle rates are intentionally explicit so production deployments can tighten public catalog traffic without editing code.

## Legacy SQL Import

If you need to migrate an existing SQLite or PostgreSQL dataset into MongoDB:

```bash
python manage.py import_legacy_sql --source-url sqlite:///db.sqlite3 --drop-target
```

Or:

```bash
LEGACY_DATABASE_URL=postgresql://user:pass@host:5432/dbname python manage.py import_legacy_sql --drop-target
```

The import preserves numeric IDs for users, catalog records, plans, docs, access grants, ratings, usage summaries, and legacy auth tokens.

## Docker

The repository now includes both a production-like container stack and a live-reload development stack.
The root `Dockerfile` is the canonical production build definition and exposes three named targets:

- `backend-runtime` for the Django API image
- `frontend-runtime` for the Nginx-served frontend image
- `app-runtime` for single-container deployments that bundle frontend and backend together

### Single-Container Deployments

Some deployment platforms only look for a root `Dockerfile`. The default final stage of the root `Dockerfile` builds the React frontend, copies it into the Django image, serves static assets through WhiteNoise, and runs the full app from one container.

Typical deploy-time environment variables for the single-container image:

```bash
MONGODB_URI=mongodb://your-mongo-host:27017
MONGODB_DATABASE=iranapi
DJANGO_SECRET_KEY=replace-this
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=your-domain.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com
PORT=8000
```

### One-Click Windows Launchers

If you are on Windows and want the simplest path:

- double-click `Run-IranAPI.bat` to build and run the production-like stack
- double-click `Run-IranAPI-Dev.bat` to start the live-reload development stack
- double-click `Stop-IranAPI.bat` to stop both stacks

The launcher creates `.env.docker` automatically the first time, starts Docker Compose in detached mode, waits for the frontend, and opens the app in your browser.

### Production-like Stack

Run the full stack with Gunicorn, Nginx, and MongoDB:

```bash
cp .env.docker.example .env.docker
docker compose --env-file .env.docker up --build
```

Optional MongoDB browser:

```bash
docker compose --env-file .env.docker --profile tools up --build
```

Services:

- frontend: `http://localhost:5173`
- backend API: `http://localhost:8000/api/v1`
- mongo: `mongodb://localhost:27017`
- mongo-express: `http://localhost:8081` when the `tools` profile is enabled

The production-like Compose stack builds both `backend` and `frontend` from the root `Dockerfile` by selecting the `backend-runtime` and `frontend-runtime` targets respectively.

### Development Stack

Use the dev compose file when you want hot reload for both Django and Vite inside containers:

```bash
cp .env.docker.example .env.docker
docker compose -f docker-compose.dev.yml --env-file .env.docker up --build
```

The development stack:

- mounts the backend and frontend source code into containers
- runs Django with `runserver`
- runs Vite on `http://localhost:5173`
- keeps frontend dependencies in a named Docker volume
- can auto-seed demo data when `IRANAPI_AUTO_SEED_SAMPLE_DATA=true`
- builds the backend container from the root `Dockerfile` via the `backend-runtime` target

## Quality Gates

### Backend

```bash
python manage.py check
python manage.py test
```

### Frontend

```bash
cd api-hub-express
npx playwright install chromium
npm run lint
npm run typecheck
npm run test
npm run build
npm run qa:crawl
```

## Canonical API Surface

### System

- `GET /api/v1/system/health/`

### Auth

- `GET /api/v1/auth/session/`
- `POST /api/v1/auth/register/`
- `POST /api/v1/auth/login/`
- `POST /api/v1/auth/logout/`

### Account

- `GET /api/v1/account/user/`
- `PATCH /api/v1/account/user/`
- `GET /api/v1/account/profile/`
- `PATCH /api/v1/account/profile/`
- `GET /api/v1/account/access/`
- `GET /api/v1/account/subscription/`
- `POST /api/v1/account/subscription/`
- `POST /api/v1/account/subscription/checkout/{checkout_id}/confirm/`
- `GET /api/v1/account/usage/`
- `GET /api/v1/account/usage/stats/`

### Catalog

- `GET /api/v1/catalog/categories/`
- `GET /api/v1/catalog/categories/{slug}/`
- `GET /api/v1/catalog/categories/{slug}/apis/`
- `GET /api/v1/catalog/apis/`
- `POST /api/v1/catalog/apis/`
- `GET /api/v1/catalog/apis/{slug}/`
- `GET /api/v1/catalog/apis/{slug}/similar/`
- `POST /api/v1/catalog/apis/{slug}/ratings/`
- `GET /api/v1/catalog/apis/{slug}/plans/`
- `GET /api/v1/catalog/apis/{slug}/docs/`
- `GET /api/v1/catalog/apis/{slug}/endpoints/`
- `GET /api/v1/catalog/pricing-plans/`
- `GET /api/v1/catalog/subscription-plans/`
- `GET /api/v1/catalog/documentations/`

### Schema

- `GET /api/v1/schema/openapi.json`

## Notes

- Portal auth uses Mongo-backed sessions stored in a dedicated collection.
- User subscription plans are managed in IranAPI through `/catalog/subscription-plans/` and `/account/subscription/`.
- Authenticated developers can publish APIs directly through `/catalog/apis/`; released APIs are active and visible in Browse/Explore.
- API details expose RapidAPI-style endpoint references, sample payloads, code snippets, and browser test console output.
- Legacy token responses still exist on compatibility auth routes.
- Local API key generation is disabled by default.
- Public API access and account subscriptions should be treated as IranAPI-managed unless a legacy importer maps old external metadata.
- Docker verification still has to be run on a machine with Docker installed.
