# Contexte du projet — Auto-École Khadija

## Vue d'ensemble
Application web de gestion d'auto-école sénégalaise. Anciennement nommée "Excellence", renommée en "Khadija".
- **Dépôt GitHub** : https://github.com/modoufaye/AutoEcoleSayda.git
- **Branche principale** : `main`
- **Dernier commit significatif** : v16

---

## Stack technique

### Backend
| Élément | Valeur |
|---|---|
| Framework | Spring Boot 3.2.5 |
| Java | 17 |
| Base de données | H2 (fichier) — `data/autoecole-db` |
| ORM | Hibernate / Spring Data JPA |
| Sécurité | Spring Security + JWT (HS512) |
| Build | Maven (`pom.xml`) |
| Jar produit | `target/auto-ecole-1.0.0.jar` |
| Port | **8080** |
| Console H2 | http://localhost:8080/h2-console |

### Frontend
| Élément | Valeur |
|---|---|
| Framework | React 19 |
| Bundler | Vite 8 |
| CSS | Tailwind CSS 4 + Bootstrap 5 + Bootstrap Icons |
| HTTP | Axios + fetch natif (`frontend/src/api.js`) |
| Routing | React Router DOM 7 |
| Port | **5173** |

Le Vite proxy redirige `/api` et `/uploads` vers `http://localhost:8080`.

---

## Lancer le projet

```bash
# Tuer les éventuels processus sur le port 8080 avant de démarrer
lsof -ti:8080 | xargs kill -9 2>/dev/null

# Backend (depuis la racine du projet)
java -jar target/auto-ecole-1.0.0.jar > /tmp/backend.log 2>&1 &

# Frontend (dans un autre terminal)
cd frontend && npm run dev > /tmp/frontend.log 2>&1 &

# Rebuild du jar si des sources Java ont changé
mvn package -DskipTests
```

---

## Sécurité & Rôles

3 rôles JWT stockés dans la table `users` :

| Rôle | Routes autorisées |
|---|---|
| `SUPER_ADMIN` | `/api/admin/**` + `/api/moniteur/**` |
| `MONITEUR` | `/api/moniteur/**` |
| `ELEVE` | `/api/eleve/**` |

Routes publiques : `/api/auth/**`, `/uploads/**`, `/h2-console/**`.

---

## Comptes de test (seedés au démarrage)

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | admin@autoecole.sn | Admin@2024 |
| Moniteur | moniteur@autoecole.sn | Moniteur@2024 |
| Moniteur | fatou.ndiaye@autoecole.sn | Moniteur@2024 |
| Moniteur | ibrahima.mbaye@autoecole.sn | Moniteur@2024 |
| Élève | eleve@autoecole.sn | Eleve@2024 |

Tous les élèves de test ont le mot de passe `Eleve@2024`.

---

## Entités principales

### Eleve
```
id, nom, prenom, dateNaissance, telephone, adresse, email, numeroCni
categoriePermis (enum), dateInscription, statut (EN_COURS / SUSPENDU / DIPLOME / ABANDONNE)
nombreLeconsCode, nombreLeconsConduite
moniteur (FK → Moniteur)
Documents dossier (boolean) : docCertResidence, docCniLegalisee, docGroupeSanguin,
  docVisiteMedicale, docPhotos, docTimbre, docEnrolement, docDelivrance
```

### Moniteur
```
id, nom, prenom, telephone, email, numeroCni, numeroPermis, dateEmbauche
categoriesAutorisees (Set<CategoriePermis>), actif (boolean)
```

### Vehicule
```
id, immatriculation, marque, modele, annee, categorie (CategoriePermis)
kilometrage, statut (DISPONIBLE / EN_SERVICE / EN_MAINTENANCE / HORS_SERVICE)
observations, prochainEntretien (LocalDate)
dateAssurance, montantAssurance, dureeAssurance (en mois), dateVisiteTechnique
```
Alerte entretien : rouge si dépassé, orange si ≤ 15 jours, vert sinon.

### Seance
```
id, titre, dateHeure, theme (ThemeSeance), statut (BROUILLON / PUBLIEE / ...)
moniteur (FK → User), eleves (ManyToMany → Eleve)
blocs (OneToMany → BlocContenu, ordonnés)
```

### Paiement
```
id, reference (auto-générée PAY-{timestamp}), date, montant (BigDecimal)
eleve (FK), typePaiement, statut (PAYE / EN_ATTENTE / ANNULE), description
```
Types : `TARIF_INSCRIPTION`, `TARIF_CODE`, `TARIF_CONDUITE`, `INSCRIPTION`, `LECON`, `EXAMEN`, `AUTRE`

### ExerciceTD / QuestionTD / ReponseTD
```
ExerciceTD  : id, titre, moniteur (FK), questions (list), createdAt
QuestionTD  : id, exercice (FK), imageUrl, avecOptionC, avecOptionD, bonneReponse, ordre
ReponseTD   : id, question (FK), eleve (FK), reponse, estCorrecte
```
Questions à 2, 3 ou 4 options (A/B, A/B/C, ou A/B + C/D indépendants).

### AutoEcoleConfig
Configuration de l'établissement (nom, adresse, tarifs…) — table singleton, gérée dans Paramètres.

---

## Catégories de permis
`POIDS_LEGER`, `POIDS_LOURD`, `TRANSPORT`, `C1`, `INTERNATIONAL`

---

## Structure des dossiers

```
sayda/
├── src/main/java/sn/autoecole/
│   ├── config/          # Seeders (Admin, Cours, Panneaux, migration)
│   ├── controller/      # 15 contrôleurs REST
│   ├── dto/             # Request/Response objects
│   ├── entity/          # Entités JPA
│   ├── enums/           # Enums métier
│   ├── exception/       # GlobalExceptionHandler
│   ├── repository/      # Spring Data repositories
│   ├── security/        # JWT (JwtUtil, JwtAuthFilter, SecurityConfig)
│   └── service/         # Logique métier
├── src/main/resources/
│   ├── application.properties
│   └── data.sql         # Données initiales (panneaux, config auto-école)
├── frontend/src/
│   ├── api.js           # Client HTTP (préfixe /api, gestion token JWT)
│   ├── App.jsx          # Routing principal
│   ├── components/      # Tous les écrans fonctionnels
│   ├── context/         # AuthContext (token, rôle, nom, email)
│   ├── layouts/         # AppLayout (sidebar + topbar)
│   └── pages/           # LandingPage, LoginPage, Forbidden
├── data/                # Fichiers H2 (ne pas committer)
├── uploads/             # Fichiers uploadés images/vidéos (ne pas committer)
└── target/              # Artefacts compilés (ne pas committer)
```

---

## Contrôleurs & routes principales

| Contrôleur | Préfixe |
|---|---|
| AuthController | `/api/auth` |
| DashboardController | `/api/admin/dashboard` |
| EleveController | `/api/admin/eleves` |
| MoniteurController | `/api/admin/moniteurs` |
| VehiculeController | `/api/admin/vehicules` |
| PaiementController | `/api/admin/paiements` |
| CoursController | `/api/admin/cours` |
| LeconController | `/api/admin/lecons` |
| ExamenController | `/api/admin/examens` |
| AutoEcoleConfigController | `/api/admin/config` |
| SeanceMoniteurController | `/api/moniteur/seances` |
| SeanceEleveController | `/api/eleve/seances` |
| ExerciceTDController | `/api/moniteur/exercices-td` + `/api/admin/exercices-td` + `/api/eleve/exercices-td` |
| ElevePortailController | `/api/eleve/...` |
| MoniteurPortailController | `/api/moniteur/...` |
| UploadController | `/api/upload` |

---

## Règles métier notables
- Chaque élève est rattaché à un moniteur (champ `moniteur_id` dans `eleves`).
- La séance code génère au moins 2 séances par élève avec son moniteur.
- L'admin a accès en lecture aux données moniteur et élèves (TD admin en lecture seule).
- Les fichiers uploadés (images questions TD, vidéos cours) sont servis depuis `/uploads/` (répertoire `uploads/` à la racine).
- Dates JSON en ISO-8601 (pas de tableau Java `[2024,1,15]`).
- Upload max : 200 MB.

---

## Ce qu'on ne committe pas
- `data/autoecole-db.mv.db` et `data/autoecole-db.trace.db`
- `target/`
- `uploads/`
