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

export DATABASE_URL="${DATABASE_URL:-mysql://sprintly:sprintly@localhost:3307/sprintly}"

if [[ ! -d node_modules ]]; then
  echo "📥 Installing dependencies..."
  pnpm install --frozen-lockfile
fi

echo "🐬 Starting MySQL (docker compose up -d mysql)..."
docker compose up -d mysql

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

echo "🤖 Processing first 20 LinkedIn connections with LLM enrichment..."
NODE_ENV=development DATABASE_URL="$DATABASE_URL" pnpm exec tsx scripts/process-connections.ts

echo "🚀 Starting dev server (frontend + API via Vite)..."
echo "   Press Ctrl+C to stop. Open http://localhost:3000"
NODE_ENV=development DATABASE_URL="$DATABASE_URL" exec pnpm dev
