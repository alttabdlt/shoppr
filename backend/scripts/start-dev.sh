#!/usr/bin/env bash
set -euo pipefail

# Monorepo root
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

for PORT in 3000 3001; do
  echo "[dev] Ensuring port ${PORT} is free…"
  pids=$(lsof -ti tcp:${PORT} || true)
  if [ -n "${pids:-}" ]; then
    echo "[dev] Killing process(es) on :${PORT} → $pids"
    kill -9 $pids || true
  fi
done

echo "[dev] Starting Postgres (shoppr-postgres)…"
if ! docker ps -a --format '{{.Names}}' | grep -q '^shoppr-postgres$'; then
  docker run --name shoppr-postgres \
    -e POSTGRES_DB=shoppr \
    -e POSTGRES_USER=shoppr \
    -e POSTGRES_PASSWORD=shoppr \
    -p 5432:5432 -d postgres:16
else
  docker start shoppr-postgres >/dev/null
fi

echo "[dev] Starting Redis (shoppr-redis)…"
if ! docker ps -a --format '{{.Names}}' | grep -q '^shoppr-redis$'; then
  docker run --name shoppr-redis -p 6379:6379 -d redis:7
else
  docker start shoppr-redis >/dev/null
fi

echo "[dev] Waiting for Postgres to become ready…"
for i in {1..30}; do
  if docker exec shoppr-postgres pg_isready -U shoppr >/dev/null 2>&1; then
    echo "[dev] Postgres is ready."
    break
  fi
  sleep 1
done

echo "[dev] Installing workspace dependencies (pnpm)…"
pnpm install

if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
  echo "[dev] ERROR: .env.local (or .env) not found at repo root. Copy .env.example and set secrets." >&2
  exit 1
fi

# Export env from root for all subprocesses
set -a
[ -f ./.env.local ] && . ./.env.local
[ -f ./.env ] && . ./.env
set +a

echo "[dev] Running database migrations…"
pnpm --filter @shoppr/web db:migrate || true

echo "[dev] Starting Next.js on http://localhost:3000 (no SSL)…"
pnpm --filter @shoppr/web dev
