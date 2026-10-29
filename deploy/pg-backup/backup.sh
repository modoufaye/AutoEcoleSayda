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

# Copie hors du serveur (Object Storage S3), seulement si S3_BUCKET est défini.
# Un échec ici garde la sauvegarde locale et sera signalé dans les logs.
[ -n "${S3_BUCKET:-}" ] || exit 0
export RCLONE_S3_PROVIDER=Other RCLONE_S3_ENDPOINT="$S3_ENDPOINT" RCLONE_S3_REGION="${S3_REGION:-}" \
       RCLONE_S3_ACCESS_KEY_ID="$S3_ACCESS_KEY" RCLONE_S3_SECRET_ACCESS_KEY="$S3_SECRET_KEY"
if rclone copyto "$f" ":s3:$S3_BUCKET/$(basename "$f")"; then
  echo "$(date '+%F %T') copie S3 OK : $S3_BUCKET/$(basename "$f")"
else
  echo "$(date '+%F %T') ERREUR : copie S3 échouée"
  exit 1
fi
rclone delete ":s3:$S3_BUCKET" --include "${PGDATABASE}-*.sql.gz" --min-age "${S3_KEEP_DAYS:-60}d"
