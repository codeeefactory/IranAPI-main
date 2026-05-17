# IranAPI Frontend

React + TypeScript frontend for the IranAPI marketplace and developer portal.

## Commands

```bash
npm install
npx playwright install chromium
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run qa:crawl
```

## Environment

Create `.env` from `.env.example`:

```bash
VITE_API_BASE_URL=/api/v1
VITE_DEV_PROXY_TARGET=http://localhost:8000
```

## Backend Expectations

- The frontend talks to the versioned backend surface at `/api/v1`.
- The backend is now MongoDB-backed, but the frontend contract stays the same.
- Session auth uses the `sessionid` cookie and the `csrftoken` cookie.

## Notes

- The app is RTL-first.
- Network calls go through `src/lib/api.ts`.
- During local Vite development, `/api`, `/static`, and `/media` are proxied to the backend target.
- The Docker image also defaults to `VITE_API_BASE_URL=/api/v1`.
- `npm run qa:crawl` starts the backend and frontend locally, then runs the Playwright smoke crawl against localhost.

## Docker

Production-like frontend container:

```bash
docker compose -f ../docker-compose.yml --env-file ../.env.docker up --build frontend
```

Live-reload frontend container:

```bash
docker compose -f ../docker-compose.dev.yml --env-file ../.env.docker up --build frontend
```

The development container mounts the frontend source tree, installs dependencies into a named Docker volume, serves Vite on `0.0.0.0:5173`, and proxies backend requests to `http://backend:8000`.
