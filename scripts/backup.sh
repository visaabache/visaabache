#!/usr/bin/env bash
# VISA ABACHE — backup script (database + encrypted document storage).
#
#   npm run backup                       # writes ./backups/visa-abache-YYYYmmdd-HHMM.tar.gz
#   BACKUP_DIR=/mnt/backups npm run backup
#
# Restore:
#   tar -xzf visa-abache-....tar.gz
#   pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" db.dump
#   cp -a storage/. "$STORAGE_LOCAL_DIR"/          # only for STORAGE_DRIVER=local
#
# Documents stay AES-256-GCM encrypted inside the archive: keep DOCUMENT_ENCRYPTION_KEY in a separate,
# safe place (password manager). Without it the documents cannot be restored. Copy archives off-site.
set -euo pipefail

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${DATABASE_URL:?DATABASE_URL is required}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
STAMP="$(date +%Y%m%d-%H%M)"
WORK="$(mktemp -d)"
trap 'rm -rf -- "$WORK"' EXIT

mkdir -p "$BACKUP_DIR"
echo "→ Dumping database"
pg_dump --format=custom --no-owner --dbname="${DIRECT_URL:-$DATABASE_URL}" --file="$WORK/db.dump"

if [[ "${STORAGE_DRIVER:-local}" == "local" && -d "${STORAGE_LOCAL_DIR:-./storage}" ]]; then
  echo "→ Copying encrypted document storage"
  cp -a "${STORAGE_LOCAL_DIR:-./storage}" "$WORK/storage"
else
  echo "→ Object storage (S3/Supabase) is not copied by this script: enable bucket versioning/replication at the provider."
fi

ARCHIVE="$BACKUP_DIR/visa-abache-$STAMP.tar.gz"
tar -czf "$ARCHIVE" -C "$WORK" .
chmod 600 "$ARCHIVE"
echo "✓ Backup written to $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"

find "$BACKUP_DIR" -maxdepth 1 -name 'visa-abache-*.tar.gz' -mtime +"$RETENTION_DAYS" -print -delete || true
