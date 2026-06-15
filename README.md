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

## 🔐 Rôles & Accès démo

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | admin@autoecole.sn | Admin@2024 |
| Moniteur | moniteur@autoecole.sn | Moniteur@2024 |
| Élève | eleve@autoecole.sn | Eleve@2024 |

---

## 🛠️ Stack technique

**Backend**
- Java · Spring Boot 3.2.5
- Spring Security · JWT
- H2 Database (fichier persistant)
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

L'API démarre sur **http://localhost:8080**

### Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application démarre sur **http://localhost:5173**

---

## 📁 Structure du projet

```
autoEcole/
├── src/                        # Backend Spring Boot
│   └── main/
│       ├── java/sn/autoecole/ # Controllers, Services, Entities
│       └── resources/
│           ├── application.properties
│           └── data.sql        # Données de test
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
