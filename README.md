# 🚗 Auto-École Khadija

> **LA CONFIANCE AU VOLANT, LA RÉUSSITE AU RENDEZ-VOUS**

Application web complète de gestion d'auto-école développée pour le marché sénégalais. Elle couvre l'ensemble du cycle de formation : inscription des élèves, suivi des leçons, gestion des examens et des paiements.

---

## ✨ Fonctionnalités

| Module | Description |
|---|---|
| 🎓 Élèves | Inscription, suivi de formation, statut (En cours / Diplômé / Suspendu) |
| 👨‍🏫 Moniteurs | Gestion des moniteurs et affectation des élèves |
| 🚘 Véhicules | Parc automobile de l'école |
| 📅 Leçons | Planification et suivi des leçons de conduite |
| 📋 Cours Code | Accès aux thèmes du code de la route |
| 🎯 Examens | Suivi des passages et résultats |
| 💳 Paiements | Gestion des frais de formation |
| 👤 Profil | Chaque utilisateur peut consulter et modifier son profil |

---

## 🔐 Rôles & Accès démo (en local uniquement)

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | admin@autoecole.sn | Admin@2024 |
| Moniteur | moniteur@autoecole.sn | Moniteur@2024 |
| Élève | eleve@autoecole.sn | Eleve@2024 |

Les comptes moniteur et élève, ainsi que les données de démonstration, n'existent qu'en
profil **dev** (`mvn spring-boot:run`). En production, seul le compte administrateur est
créé, et uniquement s'il n'existe encore aucun administrateur :
**changez son mot de passe dès le premier déploiement**.

---

## 🛠️ Stack technique

**Backend**
- Java · Spring Boot 3.2.5
- Spring Security · JWT
- PostgreSQL en production · H2 (fichier) en local
- Maven

**Frontend**
- React 19 · Vite
- Tailwind CSS v4
- Bootstrap Icons
- React Router v7

---

## 🚀 Lancer le projet en local

### Prérequis
- Java 17+
- Node.js 18+
- Maven

### Backend

```bash
cd autoEcole
mvn spring-boot:run
```

L'API démarre sur **http://localhost:8080**, en profil **dev** :
données de démonstration (`data.sql`), comptes de démo et console H2
(http://localhost:8080/h2-console, JDBC URL `jdbc:h2:file:./data/autoecole-db`, utilisateur `sa`).

Le jar lancé sans profil (`java -jar`, comme en production) ne charge rien de tout cela.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application démarre sur **http://localhost:5173**

---

## 🐘 Production : base PostgreSQL

L'application utilise PostgreSQL dès que la variable `DB_URL` est définie ; sans elle,
elle reste sur la base H2 fichier `data/autoecole-db`.

Mise en place sur CapRover :

1. **Sauvegarder** le fichier H2 de production (`/app/data/autoecole-db.mv.db`, volume persistant).
2. Installer PostgreSQL (*One-Click Apps* → PostgreSQL), créer une base `autoecole`.
3. Dans l'application → *App Configs* → variables d'environnement :
   ```
   DB_URL=jdbc:postgresql://srv-captain--<nom-app-postgres>:5432/autoecole
   DB_USER=<utilisateur>
   DB_PASSWORD=<mot de passe>
   JWT_SECRET=<résultat de `openssl rand -hex 32`>
   SPRING_PROFILES_ACTIVE=transfert-h2
   ```
4. Déployer : au démarrage, les tables sont créées puis les données H2 copiées
   (log « Transfert H2 → PostgreSQL terminé »). En cas d'erreur, rien n'est copié et
   l'application ne démarre pas : retirer `DB_URL` la remet sur H2, le temps de corriger.
5. Vérifier l'application, puis **retirer `SPRING_PROFILES_ACTIVE=transfert-h2`** et redémarrer.
   (Laissé actif, il ne recopie rien : la base contient déjà des comptes.)

Les fichiers (`uploads/`, `data/documents-eleves/`) restent sur le volume, hors de la base.

`JWT_SECRET` signe les jetons de connexion : à garder secrète et stable. Sans elle, une clé
aléatoire est tirée à chaque démarrage et tout le monde doit se reconnecter.

### Sauvegarde automatique

L'app CapRover `pg-backup` (`deploy/pg-backup/`) fait un `pg_dump` compressé au démarrage
puis chaque nuit à 3 h (UTC), dans le volume persistant `/backups`, et supprime les
sauvegardes de plus de `KEEP_DAYS` jours (14 par défaut). Résultat dans les *App Logs*.

Variables d'environnement : `PGHOST=srv-captain--postgres`, `PGUSER`, `PGPASSWORD`,
`PGDATABASE` (celles de l'app `postgres`), `KEEP_DAYS`. Déploiement :

```bash
cd deploy/pg-backup && tar -cf /tmp/pg-backup.tar . && caprover deploy -a pg-backup -t /tmp/pg-backup.tar
```

Copie hors du serveur : avec `S3_BUCKET`, chaque sauvegarde est aussi envoyée (rclone) dans
un conteneur OVH Object Storage, où elle est gardée `S3_KEEP_DAYS` jours (60 par défaut).
Variables : `S3_ENDPOINT` (ex. `https://s3.gra.io.cloud.ovh.net`), `S3_REGION` (ex. `gra`),
`S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`. Sans `S3_BUCKET`, les sauvegardes restent
seulement sur le VPS et ne protègent pas d'une perte du serveur.

---

## 📁 Structure du projet

```
autoEcole/
├── src/                        # Backend Spring Boot
│   └── main/
│       ├── java/sn/autoecole/ # Controllers, Services, Entities
│       └── resources/
│           ├── application.properties      # Configuration (production par défaut)
│           ├── application-dev.properties  # Profil dev : démo, console H2
│           ├── application-transfert-h2.properties  # Copie unique H2 → PostgreSQL
│           └── data.sql                    # Données de démonstration (dev)
├── frontend/                   # Frontend React
│   └── src/
│       ├── pages/              # LoginPage, LandingPage
│       ├── components/         # Dashboard, Eleves, Cours…
│       └── context/            # AuthContext (JWT)
└── data/                       # Base H2 persistante
```

---

## 📞 Contact

**Auto-École Khadija** · Dakar, Sénégal  
📱 +221 77 329 35 57

---

*Projet réalisé avec Spring Boot & React — Portfolio 2026*
