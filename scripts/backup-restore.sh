#!/usr/bin/env bash
set -euo pipefail

# Восстановление из бэкапа.
# Usage: ./scripts/backup-restore.sh backups/tranzitum_YYYYMMDD_HHMMSS.dump

if [ $# -ne 1 ]; then
  echo "Usage: $0 <path-to-dump>"
  echo "Available backups:"
  ls -lh backups/*.dump 2>/dev/null || echo "  (none)"
  exit 1
fi

DUMP="$1"
if [ ! -f "$DUMP" ]; then
  echo "File not found: $DUMP"
  exit 1
fi

read -p "ВНИМАНИЕ: БД будет перезаписана из $DUMP. Продолжить? [y/N] " confirm
[ "$confirm" = "y" ] || exit 0

FILENAME=$(basename "$DUMP")
docker compose cp "$DUMP" postgres:/tmp/$FILENAME
docker compose exec postgres sh -c "
  dropdb -U \$POSTGRES_USER --if-exists \$POSTGRES_DB && \
  createdb -U \$POSTGRES_USER \$POSTGRES_DB && \
  pg_restore -U \$POSTGRES_USER -d \$POSTGRES_DB /tmp/$FILENAME && \
  rm /tmp/$FILENAME
"
echo "✓ restore done"
