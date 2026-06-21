# Journal des modifications — Auto-École Khadija

> Ce fichier recense toutes les modifications apportées aux fichiers sources du projet,
> commit par commit, pour ne rien perdre entre les sessions.

---

## Backend — Fichiers Java modifiés

### `src/main/java/sn/autoecole/entity/Vehicule.java`
**Ajouts :**
```java
private LocalDate dateAssurance;
private Integer montantAssurance;
private Integer dureeAssurance;      // en mois
private LocalDate dateVisiteTechnique;
```
Commits : `6344e1a` (prochainEntretien), `55f0a09` (assurance + visite technique)

---

### `src/main/java/sn/autoecole/dto/VehiculeRequest.java`
**Ajouts :**
```java
private LocalDate prochainEntretien;
private LocalDate dateAssurance;
private Integer montantAssurance;
private Integer dureeAssurance;
private LocalDate dateVisiteTechnique;
```
Commits : `6344e1a`, `55f0a09`

---

### `src/main/java/sn/autoecole/service/VehiculeService.java`
**Ajouts dans `creer()` et `modifier()` :**
```java
vehicule.setProchainEntretien(req.getProchainEntretien());
vehicule.setDateAssurance(req.getDateAssurance());
vehicule.setMontantAssurance(req.getMontantAssurance());
vehicule.setDureeAssurance(req.getDureeAssurance());
vehicule.setDateVisiteTechnique(req.getDateVisiteTechnique());
```
Commits : `6344e1a`, `55f0a09`

---

### `src/main/java/sn/autoecole/enums/TypePaiement.java`
**Ajouts (3 nouvelles valeurs) :**
```java
TARIF_INSCRIPTION("Tarif inscription"),
TARIF_CODE("Tarif code"),
TARIF_CONDUITE("Tarif conduite"),
```
Les anciennes valeurs (INSCRIPTION, LECON, EXAMEN, AUTRE) sont conservées.
Commit : `5b49585`

---

### `src/main/java/sn/autoecole/entity/Eleve.java`
**Ajouts — 8 champs documents dossier :**
```java
private boolean docCertResidence;
private boolean docCniLegalisee;
private boolean docGroupeSanguin;
private boolean docVisiteMedicale;
private boolean docPhotos;
private boolean docTimbre;
private boolean docEnrolement;
private boolean docDelivrance;
```
Commit : `93bccd8`

---

### `src/main/java/sn/autoecole/entity/ExerciceTD.java`
**Ajout du champ moniteur :**
```java
@ManyToOne(fetch = FetchType.EAGER)
@JoinColumn(name = "moniteur_id")
private Moniteur moniteur;
```
Commit : `b1e0aac`

---

### `src/main/java/sn/autoecole/controller/ExerciceTDController.java`
**Endpoints ajoutés :**
- `GET  /api/admin/exercices-td` → liste avec moniteur + élèves + scores
- `GET  /api/moniteur/exercices-td/stats` → stats par élève
- `POST /api/moniteur/exercices-td/{id}/questions` → ajout question sur existant
- `PUT  /api/moniteur/exercices-td/questions/{id}` → modifier une question
- `DELETE /api/moniteur/exercices-td/questions/{id}` → supprimer une question
- `PATCH /api/moniteur/exercices-td/{id}` → renommer un exercice

**Logique :** questions à 2 options (A/B), 3 options (A/B/C), ou 4 options (A/B + C/D indépendants).
Commits : `763052a`, `d7a7547`, `0560f58`, `b1e0aac`, `098319f`

---

### `src/main/java/sn/autoecole/controller/SeanceMoniteurController.java`
**Modification :** ajout de la logique pour que chaque élève ait au moins 2 séances avec son moniteur.
Commit : `55f0a09`

---

### `src/main/java/sn/autoecole/service/SeanceService.java`
**Modification :** complétion des séances manquantes (idempotent via `WHERE NOT EXISTS`).
Commit : `55f0a09`

---

### `src/main/java/sn/autoecole/dto/DashboardStats.java`
**Ajouts :**
```java
private double revenusMois;
private int paiementsMois;
private int elevesNouveauxMois;
```
Commits : `f880f93`, `cc6d492`

---

### `src/main/java/sn/autoecole/service/DashboardService.java`
**Ajouts :** calcul des revenus du mois et des nouveaux élèves du mois (filtré sur le mois courant).
Commits : `f880f93`, `cc6d492`

---

### `src/main/java/sn/autoecole/repository/PaiementRepository.java`
**Ajout :**
```java
@Query("SELECT SUM(p.montant) FROM Paiement p WHERE MONTH(p.date) = :mois AND YEAR(p.date) = :annee")
Double sumMontantByMoisAnnee(int mois, int annee);

@Query("SELECT COUNT(p) FROM Paiement p WHERE MONTH(p.date) = :mois AND YEAR(p.date) = :annee")
int countByMoisAnnee(int mois, int annee);
```
Commit : `cc6d492`

---

### `src/main/java/sn/autoecole/repository/EleveRepository.java`
**Ajout :**
```java
List<Eleve> findByDateInscriptionBetween(LocalDate debut, LocalDate fin);
```
Commit : `f880f93`

---

### `src/main/java/sn/autoecole/repository/ReponseTDRepository.java`
**Ajouts :**
```java
List<Eleve> findDistinctElevesByExerciceId(Long exerciceId);
long countBonnesReponses(Long eleveId, Long exerciceId);
void deleteByQuestionExerciceIdAndEleveId(Long exId, Long eleveId);
void deleteByQuestionId(Long questionId);
void deleteByQuestionExerciceId(Long exId);
```
Commits : `b1e0aac`, `098319f`

---

### `src/main/java/sn/autoecole/entity/AutoEcoleConfig.java` *(nouveau)*
Entité singleton pour la configuration de l'établissement (nom, adresse, tarifs, logo, signature).
Commit : `eb45a3e`

---

### `src/main/java/sn/autoecole/controller/AutoEcoleConfigController.java` *(nouveau)*
Routes : `GET /api/admin/config`, `PUT /api/admin/config`.
Commit : `eb45a3e`

---

### `src/main/java/sn/autoecole/config/CategoriePermisMigrationSeeder.java` *(nouveau)*
Migration au démarrage pour élargir les colonnes H2 (`bonne_reponse`, `reponse`, etc.) et corriger les contraintes CHECK bloquantes.
Commits : `93bccd8`, `f7831e3`, `088d69d`

---

### `src/main/resources/data.sql`
**Modifications cumulées :**
- Seed des véhicules avec champs assurance et visite technique
- Séances de code : chaque élève rattaché à au moins 2 séances avec son moniteur
- Rattachement des TDs sans moniteur au premier moniteur du système
- Remplacement du nom de l'établissement : Sayda → Excellence → Khadija
- Ajout de panneaux de signalisation et blocs contenu séances

---

## Frontend — Fichiers JSX/JS modifiés

### `frontend/src/components/Vehicules.jsx`
**Modifications :**
- Nouveaux champs dans le formulaire : `dateAssurance`, `montantAssurance`, `dureeAssurance`, `dateVisiteTechnique`
- Tableau refondu : colonnes « Assurance (expiration) » et « Visite technique (expiration) » avec badges colorés
- Clic sur l'immatriculation → panneau profil du véhicule
- Seuil alerte entretien : 15 jours (était 30)
- Libellé bouton retour : « Retour » (était « Tableau de bord »)
- Colonne « Année » et « Kilométrage » retirées du tableau principal
Commits : `6344e1a`, `eb45a3e`, `098319f`, `55f0a09`

---

### `frontend/src/components/Eleves.jsx`
**Modifications :**
- Modal ajout/modification : nouveau header gradient bleu marine avec avatar et nom
- Bouton « Nouveau versement » dans l'onglet Paiements du profil élève (formulaire inline : date, montant, type, statut, notes)
- Filtre « Nouveaux ce mois » dans la liste élèves
- Affichage des documents du dossier dans le profil
Commits : `99c5b9e`, `6ae65d5`, `19df4a0`, `55f0a09`

---

### `frontend/src/components/Dashboard.jsx`
**Modifications :**
- Carte « Nouveaux élèves (mois) » dans la section Élèves
- Carte « Revenus [mois] » dans la section Finance (violette)
- Suppression de la carte « Paiements enregistrés »
- Correction total élèves = EN_COURS + DIPLOME + SUSPENDU (sans ABANDONNE)
Commits : `e31c5bf`, `bab5938`, `f880f93`, `cc6d492`, `55f0a09`

---

### `frontend/src/components/TravauxDirigesAdmin.jsx` *(nouveau)*
Vue lecture seule pour l'admin :
- Accordéon par exercice avec moniteur créateur, nombre de questions, date
- Liste des élèves ayant participé avec score (bonnes/total) et couleur vert/orange/rouge
Commits : `b1e0aac`, `098319f`

---

### `frontend/src/components/TravauxDirigesMoniteur.jsx`
**Modifications :**
- Création d'exercice avec questions (image + bonneReponse + option C/D)
- Ajout/modification/suppression de questions sur un exercice existant
- Renommer un exercice (PATCH)
- Score par élève avec code couleur
- Modal de confirmation personnalisé pour suppression (Esc pour fermer)
- Bouton retour vers le tableau de bord moniteur
Commits : `763052a`, `d7a7547`, `0560f58`, `098319f`, `eb45a3e`

---

### `frontend/src/components/TravauxDirigesEleve.jsx`
**Modifications :**
- Option C masquée si non incluse par le moniteur
- Option D : deux paires indépendantes A/B et C/D
- Score final en fin de série avec possibilité de rejouer
- Suppression du bouton retour dupliqué
Commits : `8e86cce`, `763052a`, `5235da3`, `64f57a1`, `eb45a3e`

---

### `frontend/src/components/Parametres.jsx` *(nouveau)*
Page de configuration de l'établissement (SUPER_ADMIN) :
- Nom, adresse, téléphone, email, site web
- Tarifs (inscription, code, conduite, examen)
- Upload logo et signature (masqués dans l'UI actuelle)
Commit : `eb45a3e`

---

### `frontend/src/components/MesPaiements.jsx`
**Modification :** affiche le nom et l'email de l'élève dans la bannière.
Commit : `b1e0aac`

---

### `frontend/src/components/Moniteurs.jsx`
**Modifications :**
- Badges colorés pour les catégories autorisées
- Titre uniformisé
Commits : `eb45a3e`, `55f0a09`

---

### `frontend/src/components/Examens.jsx`
**Modifications :** modale migrée vers pattern Bootstrap `modal-dialog`; titre uniformisé.
Commit : `eb45a3e`

---

### `frontend/src/components/Lecons.jsx`
**Modifications :** modale migrée vers pattern Bootstrap; bouton retour moniteur ajouté.
Commits : `eb45a3e`, `098319f`

---

### `frontend/src/components/Cours.jsx`
**Modification :** bouton retour moniteur ajouté.
Commit : `098319f`

---

### `frontend/src/components/MonProfil.jsx`
**Modification :** bouton retour moniteur ajouté.
Commit : `098319f`

---

### `frontend/src/components/Paiements.jsx`
**Modification :** modale migrée vers pattern Bootstrap; types de paiement mis à jour.
Commit : `eb45a3e`

---

### `frontend/src/components/SeancesMoniteur.jsx`
**Modification :** bouton retour séances ajouté; titre uniformisé.
Commits : `5235da3`, `eb45a3e`

---

### `frontend/src/components/SeancesEleve.jsx`
**Modification :** titre uniformisé.
Commit : `55f0a09`

---

### `frontend/src/layouts/AppLayout.jsx`
**Modifications :**
- Icône véhicule dans le logo de la barre latérale
- Correction navigation sidebar vers Élèves depuis un profil ouvert
- Entrée « Travaux Dirigés » dans le menu admin et moniteur
- Entrée « Paramètres » dans le menu admin
- Nom de l'établissement : « Auto-École Khadija »
Commits : `5207690`, `dc3d229`, `b1e0aac`, `eb45a3e`, `a4c3caa`, `55f0a09`

---

### `frontend/src/pages/LandingPage.jsx`
**Modifications :**
- Nom : « Auto-École Khadija » (remplace Excellence)
- Ajustements design
Commits : `a4c3caa`, `f7d74b4`, `55f0a09`

---

### `frontend/src/pages/LoginPage.jsx`
**Modifications :**
- Nom : « Auto-École Khadija »
- Améliorations visuelles page de connexion
Commits : `a4c3caa`, `f7d74b4`, `55f0a09`

---

## Récapitulatif des commits (du plus récent au plus ancien)

| Hash | Description |
|------|-------------|
| `75b190b` | context.md + commit data/target (à éviter à l'avenir) |
| `f7d74b4` | Remplace Excellence → Khadija dans toute l'interface (v16) |
| `55f0a09` | Véhicules assurance + visite technique ; refonte modal élève (v15) |
| `4ebb999` | Séances de code : 2 séances minimum par élève (v12) |
| `098319f` | TD scores élèves, bouton retour moniteur, modal suppr, endpoint questions (v14) |
| `b1e0aac` | TD admin lecture seule ; nom élève dans Mes Paiements (v13) |
| `a4c3caa` | Renomme Excellence → Khadija (v12) |
| `6ae65d5` | Bouton Nouveau versement dans profil élève |
| `f7831e3` | Supprime contraintes CHECK H2 bloquantes |
| `5207690` | Icône véhicule dans logo sidebar |
| `dc3d229` | Corrige navigation sidebar → Élèves depuis profil |
| `253200d` | Supprime bouton retour dupliqué profil élève |
| `5b49585` | Ajout TARIF_INSCRIPTION/CODE/CONDUITE dans TypePaiement |
| `bab5938` | Supprime carte Paiements enregistrés du dashboard |
| `f630dea` | Masque logo/signature dans Paramètres |
| `e31c5bf` | Correction total élèves dashboard |
| `cc6d492` | Revenus du mois dans dashboard (v17) |
| `f880f93` | Nouveaux élèves du mois dans dashboard (v16) |
| `99c5b9e` | Filtre nouveaux élèves du mois dans la liste (v15) |
| `6344e1a` | Date prochain entretien véhicule (v14) |
| `eb45a3e` | UI modales Bootstrap + page Paramètres + TD amélioré (v13) |
| `19df4a0` | Documents dossier dans Mon Espace élève (v12) |
| `64f57a1` | Score final TD + rejouer (v15) |
| `0560f58` | Modifier titre exercice TD (v14) |
| `d7a7547` | Modifier choix question TD (v13) |
| `5235da3` | Bloc audio + option D + retour séances |
| `93bccd8` | Nouvelles catégories permis + documents dossier |
| `763052a` | Restructure TD : exercices multi-questions + option C |
| `8e86cce` | Fonctionnalité Travaux Dirigés initiale |

---

## Ce qu'il ne faut JAMAIS committer

- `data/autoecole-db.mv.db` et `data/autoecole-db.trace.db` (base H2)
- `target/` (artefacts Maven)
- `uploads/` (images et vidéos uploadées)

## Commande de lancement (rappel)

```bash
# Toujours depuis la racine /Users/elhadjimodoufaye/sayda
lsof -ti:8080 | xargs kill -9 2>/dev/null
java -jar target/auto-ecole-1.0.0.jar > /tmp/backend.log 2>&1 &
cd frontend && npm run dev > /tmp/frontend.log 2>&1 &
# Rebuild si sources Java modifiées
mvn package -DskipTests
```
