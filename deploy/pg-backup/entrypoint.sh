#!/bin/sh
# crond ne transmet pas l'environnement du conteneur aux tâches : on le fige dans un fichier
env | grep -E '^(PG|KEEP_DAYS)' | sed 's/^/export /' > /etc/backup.env
chmod 600 /etc/backup.env
/usr/local/bin/backup.sh   # une sauvegarde dès le démarrage
exec crond -f -l 8
