#!/usr/bin/env bash
set -euo pipefail

# ------------------------------------------------------------
#  deploy.sh — деплой прода с ветки main
# ------------------------------------------------------------
#  Запускать на сервере из корня клона (/opt/tranzitus).
# ------------------------------------------------------------

cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "ERROR: .env not found in $(pwd)"
  echo "  cp .env.prod.example .env  и заполни"
  exit 1
fi

echo "→ git fetch + pull main"
git fetch --prune
git checkout main
git pull --ff-only

echo "→ build app image"
docker compose build app

echo "→ migrate database"
docker compose run --rm app sh -c "cd packages/db && npx drizzle-kit migrate"

echo "→ restart services"
docker compose up -d

echo "→ prune old images"
docker image prune -f

echo
echo "✓ deploy done"
docker compose ps
