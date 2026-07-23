#!/bin/sh
set -eu

database_path="${DATABASE_PATH:-/data/shangjiabianma.db}"
backup_dir="${BACKUP_DIR:-/backups}"
interval="${BACKUP_INTERVAL_SECONDS:-21600}"
retention_days="${BACKUP_RETENTION_DAYS:-30}"

mkdir -p "$backup_dir"

while true; do
  if [ -f "$database_path" ]; then
    timestamp="$(date '+%Y%m%d-%H%M%S')"
    destination="$backup_dir/shangjiabianma-$timestamp.db"
    sqlite3 "$database_path" ".backup '$destination'"
    if [ "$(sqlite3 "$destination" 'PRAGMA integrity_check;')" != "ok" ]; then
      rm -f "$destination"
      echo "Backup integrity check failed" >&2
      exit 1
    fi
    find "$backup_dir" -type f -name 'shangjiabianma-*.db' -mtime "+$retention_days" -delete
  fi
  sleep "$interval"
done

