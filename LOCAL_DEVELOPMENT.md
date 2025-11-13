# Sprintly AI — Local Development Guide

This guide explains how to run Sprintly AI locally for development. It uses a local MySQL running in Docker and starts the app with hot reload (Vite + Express).

## Prerequisites

- Node.js 22.x (with Corepack)
- pnpm (via Corepack)
- Docker Desktop (Compose v2)
- Git

Verify:

```bash
node -v
corepack enable
corepack prepare pnpm@10.22.0 --activate
pnpm -v
docker -v && docker compose version
```

## 1) Clone and install

```bash
git clone https://github.com/hrunx/sprintly-mvp.git
cd sprintly-mvp
corepack enable
corepack prepare pnpm@10.22.0 --activate
pnpm install
```

## 2) Start local MySQL (Docker)

We ship a compose file for development (`docker-compose.yml`) that runs MySQL 8 on host port 3307.

```bash
docker compose up -d mysql
```

If you ever need a clean DB:

```bash
docker compose down -v
docker compose up -d mysql
```

## 3) Environment variables (dev)

For development, you can export envs inline when running commands, or create a `.env` file. The minimal required vars are:

```env
# App
PORT=3000
JWT_SECRET=change-me-please-1234567890
VITE_APP_ID=sprintly-local

# Database (Docker MySQL at 127.0.0.1:3307)
DATABASE_URL=mysql://sprintly:sprintly@127.0.0.1:3307/sprintly
```

Note: Authentication is disabled in demo mode; all tRPC endpoints are public for local development.

## 4) Run migrations

```bash
DATABASE_URL=mysql://sprintly:sprintly@127.0.0.1:3307/sprintly pnpm db:push
```

## 5) Seed sample data (optional, recommended)

```bash
DATABASE_URL=mysql://sprintly:sprintly@127.0.0.1:3307/sprintly npx tsx scripts/seed-company-data.ts
```

This creates ~50 companies, 80 investors, and 150 matches.

## 6) Start the dev server

```bash
PORT=3000 \
DATABASE_URL=mysql://sprintly:sprintly@127.0.0.1:3307/sprintly \
JWT_SECRET=change-me-please-1234567890 \
VITE_APP_ID=sprintly-local \
pnpm dev
```

Open:

```text
http://localhost:3000
```

## 7) Verify APIs quickly

```bash
curl -fsS "http://localhost:3000/api/trpc/analytics.overview?input=%7B%7D"
```

## Useful scripts

- Apply schema changes: `pnpm db:push`
- Run unit tests: `pnpm test`
- Format code: `pnpm format`

## Troubleshooting

- Port 3307 is busy
  - Change the host port in `docker-compose.yml` from `3307:3306` to a free port and update `DATABASE_URL` accordingly.

- Drizzle unable to connect
  - Ensure MySQL is healthy: `docker compose exec -T mysql mysqladmin ping -h127.0.0.1 -uroot -proot`
  - Confirm creds from `docker-compose.yml`: user `sprintly`, password `sprintly`, DB `sprintly`.

- Frontend not reloading
  - Make sure you started with `pnpm dev` (Vite runs in middleware mode).

## Notes

- Demo mode: no login required; all pages and endpoints are accessible while developing locally.
- CSV templates are under `public/templates/`.
- Production stack (for staging) uses `docker-compose.prod.yml` and `Caddyfile` with TLS and reverse proxy.


