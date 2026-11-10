# Déploiement : une installation par auto-école

Chaque auto-école a sa propre installation sur le serveur CapRover (`captain.khadija.auto-ecole.sn`) :
une app **site** (nginx), une app **serveur** (Java) et sa **base PostgreSQL** (dans l'app `postgres`).
Le même code sert toutes les auto-écoles ; leurs différences sont dans Paramètres (nom, bureaux,
page d'accueil) et dans `deploy/clients.json` (domaine, apps, nom de l'application installée).

Un push sur `main` met à jour **toutes** les auto-écoles dont `"actif": true` :
- `deploy-frontend.yml` construit le site de chacune (son nom dans `.env.production.local`) ;
- `deploy-backend.yml` construit et teste le serveur une fois, puis l'envoie à chacune.

## Ajouter une auto-école

1. **DNS** : `<id>.auto-ecole.sn` → `159.173.136.236` (enregistrement A).
2. **Base** (sur le serveur) : un utilisateur et une base à son nom dans l'app `postgres`.
3. **CapRover** :
   - app `<id>-backend` (sans accès HTTP public), volumes `/app/data` et `/app/uploads`,
     variables `DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `ECOLE_NOM`, `ADMIN_MOT_DE_PASSE_INITIAL` ;
   - app `<id>` (site) : domaine `<id>.auto-ecole.sn`, HTTPS activé et forcé, port 80.
4. **GitHub** (Settings → Secrets → Actions) : les jetons des deux apps (App Token de CapRover).
5. **`deploy/clients.json`** : ajouter l'auto-école avec `"actif": true`, puis pousser sur `main`.
6. **Sauvegardes** : `pg-backup` sauvegarde toutes les bases ; rien à faire.
7. Se connecter avec `admin@autoecole.sn` et le mot de passe initial, le changer, puis remplir
   Paramètres (nom, bureaux, page d'accueil) ; retirer `ADMIN_MOT_DE_PASSE_INITIAL` ensuite.
