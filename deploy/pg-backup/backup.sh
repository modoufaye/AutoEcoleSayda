#!/bin/sh
set -eu -o pipefail
. /etc/backup.env
f="/backups/${PGDATABASE}-$(date +%Y-%m-%d_%H%M).sql.gz"
if pg_dump --no-owner | gzip > "$f.tmp"; then
  mv "$f.tmp" "$f"
  echo "$(date '+%F %T') sauvegarde OK : $f ($(du -h "$f" | cut -f1))"
else
  rm -f "$f.tmp"
  echo "$(date '+%F %T') ERREUR : sauvegarde échouée"
  exit 1
fi
find /backups -name "${PGDATABASE}-*.sql.gz" -mtime +"${KEEP_DAYS:-14}" -delete
