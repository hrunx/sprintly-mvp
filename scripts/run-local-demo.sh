#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-.env.prod}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ Env file $ENV_FILE not found. Create it before running."
  exit 1
fi

echo "📦 Loading environment from $ENV_FILE"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# Force local DB for Docker Desktop bridge
export DATABASE_URL="mysql://sprintly:sprintly@localhost:3307/sprintly"

if [[ ! -d node_modules ]]; then
  echo "📥 Installing dependencies..."
  pnpm install --frozen-lockfile
elif [[ ! -x node_modules/.bin/cross-env ]]; then
  echo "📥 cross-env missing; installing dev dependencies..."
  pnpm install --frozen-lockfile
fi

echo "🐬 Starting MySQL (docker compose up -d mysql)..."
docker compose up -d mysql

if [[ "${FIRECRAWL_ENABLED:-0}" == "1" ]]; then
  echo "🕸️  Starting Firecrawl (docker compose up -d firecrawl)..."
  if ! docker compose up -d firecrawl; then
    echo "⚠️  Firecrawl failed to start (likely registry auth). To enable it, run 'docker login ghcr.io' with valid credentials, then rerun with FIRECRAWL_ENABLED=1."
  fi
else
  echo "ℹ️  Firecrawl disabled. Set FIRECRAWL_ENABLED=1 to start it."
fi

echo "⏳ Waiting for MySQL to become healthy..."
for i in {1..30}; do
  if docker compose exec -T mysql mysqladmin ping -h 127.0.0.1 -uroot -proot --silent; then
    echo "✅ MySQL is ready."
    break
  fi
  sleep 2
  if [[ $i -eq 30 ]]; then
    echo "❌ MySQL did not become ready in time."
    exit 1
  fi
done

echo "🗄️  Running migrations..."
NODE_ENV=development DATABASE_URL="$DATABASE_URL" pnpm exec drizzle-kit migrate

if [[ -f server/data/connection-profiles.json && -z "${FORCE_ENRICH:-}" ]]; then
  echo "🤖 Skipping enrichment (server/data/connection-profiles.json exists). Set FORCE_ENRICH=1 to re-run."
else
  echo "🤖 Processing first 20 LinkedIn connections with LLM enrichment..."
  NODE_ENV=development DATABASE_URL="$DATABASE_URL" pnpm exec tsx scripts/process-connections.ts
fi

echo "🚀 Starting dev server (frontend + API via Vite)..."
echo "   Press Ctrl+C to stop. Open http://localhost:3000"
NODE_ENV=development DATABASE_URL="$DATABASE_URL" exec pnpm dev
