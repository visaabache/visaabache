#!/usr/bin/env bash
# Database dump (and local uploads, if any) into ./backups. Schedule it daily with cron, and copy ./backups off the server.
# With Supabase, daily backups are also included in paid plans (Project → Database → Backups).
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] && set -a && . ./.env && set +a
URL="${DIRECT_URL:-$DATABASE_URL}"
STAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p backups
pg_dump --no-owner --no-privileges --format=custom "$URL" > "backups/db-$STAMP.dump"
if [ -d storage/uploads ]; then tar -czf "backups/uploads-$STAMP.tar.gz" storage/uploads; fi
# Keep the last 30 of each
ls -1t backups/db-*.dump 2>/dev/null | tail -n +31 | xargs -r rm --
ls -1t backups/uploads-*.tar.gz 2>/dev/null | tail -n +31 | xargs -r rm --
echo "Backup written: backups/db-$STAMP.dump"
# Restore: pg_restore --clean --no-owner -d "$URL" backups/db-XXXX.dump
