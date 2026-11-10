#!/bin/sh
# Sauvegarde chaque base de l'app postgres (une par auto-école) : /backups/<base>-<date>.sql.gz,
# gardée KEEP_DAYS jours, puis copiée sur l'Object Storage S3 si S3_BUCKET est défini.
# PGDATABASE ne sert qu'à se connecter pour lister les bases.
set -eu -o pipefail
. /etc/backup.env

bases=$(psql -d "${PGDATABASE:-postgres}" -Atc "SELECT datname FROM pg_database WHERE NOT datistemplate AND datname <> 'postgres' ORDER BY datname")
[ -n "$bases" ] || { echo "$(date '+%F %T') ERREUR : aucune base trouvée"; exit 1; }

echec=0
for base in $bases; do
  f="/backups/${base}-$(date +%Y-%m-%d_%H%M).sql.gz"
  if pg_dump --no-owner -d "$base" | gzip > "$f.tmp"; then
    mv "$f.tmp" "$f"
    echo "$(date '+%F %T') sauvegarde OK : $f ($(du -h "$f" | cut -f1))"
  else
    rm -f "$f.tmp"
    echo "$(date '+%F %T') ERREUR : sauvegarde de $base échouée"
    echec=1
    continue
  fi
  find /backups -name "${base}-*.sql.gz" -mtime +"${KEEP_DAYS:-14}" -delete

  # Copie hors du serveur (Object Storage S3), seulement si S3_BUCKET est défini.
  # Un échec ici garde la sauvegarde locale et sera signalé dans les logs.
  [ -n "${S3_BUCKET:-}" ] || continue
  export RCLONE_S3_PROVIDER=Other RCLONE_S3_ENDPOINT="$S3_ENDPOINT" RCLONE_S3_REGION="${S3_REGION:-}" \
         RCLONE_S3_ACCESS_KEY_ID="$S3_ACCESS_KEY" RCLONE_S3_SECRET_ACCESS_KEY="$S3_SECRET_KEY"
  if rclone copyto "$f" ":s3:$S3_BUCKET/$(basename "$f")"; then
    echo "$(date '+%F %T') copie S3 OK : $S3_BUCKET/$(basename "$f")"
    rclone delete ":s3:$S3_BUCKET" --include "${base}-*.sql.gz" --min-age "${S3_KEEP_DAYS:-60}d" || true
  else
    echo "$(date '+%F %T') ERREUR : copie S3 de $base échouée"
    echec=1
  fi
done
exit $echec
