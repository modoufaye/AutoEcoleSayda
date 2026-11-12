package sn.autoecole.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import sn.autoecole.entity.*;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.repository.*;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Journal des actions du super admin, des administrateurs, du secrétariat, des moniteurs et des élèves.
 * Rempli par JournalInterceptor (toute requête de modification réussie) et par AuthService
 * (connexions). On n'y garde que le libellé de l'action et le nom de l'élément concerné,
 * jamais le contenu des formulaires (mots de passe, pièces…).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JournalService {

    /** Rôles dont les actions sont tracées. */
    public static final Set<RoleUser> ROLES_TRACES = Set.of(RoleUser.SUPER_ADMIN, RoleUser.ADMIN, RoleUser.SECRETAIRE, RoleUser.MONITEUR, RoleUser.ELEVE);

    private static final Pattern ID = Pattern.compile("/\\d+(?=/|$)");

    /**
     * Libellé par « MÉTHODE chemin » (identifiants remplacés par {id}). Valeur null : action non
     * tracée (envois de fichiers, enregistrés ensuite avec la fiche).
     */
    private static final Map<String, String> LIBELLES = new LinkedHashMap<>();
    static {
        String[][] l = {
            {"POST /api/admin/administrateurs", "Création d'un compte administrateur"},
            {"PATCH /api/moniteur/seances/{id}/eleves", "Ajout ou retrait de ses élèves dans une séance de l'administration"},
            {"POST /api/eleves/{id}/bienvenue-envoyee", "Envoi du message de bienvenue (identifiants) sur WhatsApp"},
            {"POST /api/conversations", null},
            {"POST /api/conversations/{id}/messages", null},   // messages privés : pas de trace de leur contenu
            {"POST /api/presence/depart", null},               // déconnexion (présence en ligne)
            {"POST /api/annonces", "Publication d'une annonce"},
            {"DELETE /api/annonces/{id}", "Suppression d'une annonce"},
            {"POST /api/annonces/lues", null},
            {"POST /api/medias", "Ajout à la médiathèque"},
            {"PUT /api/medias/{id}", "Modification d'un média de la médiathèque"},
            {"DELETE /api/medias/{id}", "Suppression d'un média de la médiathèque"},
            {"PUT /api/audios-wolof", "Ajout d'une explication en wolof"},
            {"DELETE /api/audios-wolof", "Suppression d'une explication en wolof"},
            {"DELETE /api/admin/administrateurs/{id}", "Suppression d'un compte administrateur"},
            {"PATCH /api/admin/administrateurs/{id}/actif", "Activation ou désactivation d'un administrateur"},
            {"POST /api/admin/administrateurs/{id}/identifiants", "Nouveau mot de passe pour un administrateur"},
            {"PATCH /api/admin/administrateurs/{id}/role", "Changement de rôle d'un administrateur"},
            {"POST /api/admin/secretaires", "Création d'un compte secrétariat"},
            {"DELETE /api/admin/secretaires/{id}", "Suppression d'un compte secrétariat"},
            {"PATCH /api/admin/secretaires/{id}/actif", "Activation ou désactivation d'un compte secrétariat"},
            {"POST /api/admin/secretaires/{id}/identifiants", "Nouveau mot de passe pour le secrétariat"},
            {"PUT /api/admin/config", "Modification des paramètres de l'auto-école"},
            {"POST /api/admin/config/moniteur-par-defaut/appliquer", "Application du moniteur par défaut aux élèves"},
            {"POST /api/admin/upload/image", null},
            {"POST /api/auth/register", "Création d'un compte (adresse directe)"},
            {"PUT /api/compte/changer-mot-de-passe", "Changement de son mot de passe"},
            {"PUT /api/compte/profil", "Modification de son profil"},
            {"POST /api/comptes-bloques/{id}/debloquer", "Déblocage d'un compte"},
            {"POST /api/cours", "Ajout d'un cours de code"},
            {"PUT /api/cours/{id}", "Modification d'un cours de code"},
            {"DELETE /api/cours/{id}", "Suppression d'un cours de code"},
            {"POST /api/demandes-inscription/{id}/approuver", "Approbation d'une inscription en ligne"},
            {"POST /api/demandes-inscription/{id}/refuser", "Refus d'une inscription en ligne"},
            // Espace élève
            {"PUT /api/eleve/changer-mot-de-passe", "Changement de son mot de passe"},
            {"PUT /api/eleve/profil", "Modification de son profil"},
            {"POST /api/eleve/paiements/declarer", "Déclaration d'un paiement Wave ou Orange Money"},
            {"POST /api/eleve/code/progression", "Quiz de code terminé"},
            {"POST /api/eleve/seances/{id}/quiz", "Quiz de séance de code terminé"},
            {"POST /api/eleve/exercices-td/questions/{id}/repondre", "Réponse à une question de travail dirigé"},
            {"DELETE /api/eleve/exercices-td/{id}/mes-reponses", "Reprise d'un travail dirigé (réponses effacées)"},
            {"POST /api/eleves", "Inscription d'un élève"},
            {"POST /api/eleves/import", "Import d'élèves depuis Excel"},
            {"PUT /api/eleves/{id}", "Modification d'une fiche élève"},
            {"DELETE /api/eleves/{id}", "Suppression d'un élève"},
            {"PATCH /api/eleves/{id}/archiver", "Archivage d'un élève"},
            {"PATCH /api/eleves/{id}/reactiver", "Réactivation d'un élève"},
            {"PATCH /api/eleves/{id}/statut", "Changement de statut d'un élève"},
            {"PATCH /api/eleves/{id}/documents-remis", "Mise à jour des documents d'un élève"},
            {"POST /api/eleves/{id}/creer-compte", "Création du compte de l'élève"},
            {"POST /api/eleves/{id}/identifiants", "Nouveaux identifiants pour l'élève"},
            {"POST /api/eleves/{id}/documents", "Ajout d'une pièce au dossier"},
            {"DELETE /api/eleves/{id}/documents/{id}", "Suppression d'une pièce du dossier"},
            {"POST /api/examens", "Ajout d'un examen"},
            {"DELETE /api/examens/{id}", "Suppression d'un examen"},
            {"PATCH /api/examens/{id}/resultat", "Saisie du résultat d'un examen"},
            {"POST /api/lecons", "Ajout d'une leçon"},
            {"PUT /api/lecons/{id}", "Modification d'une leçon"},
            {"DELETE /api/lecons/{id}", "Suppression d'une leçon"},
            {"PATCH /api/lecons/{id}/annuler", "Annulation d'une leçon"},
            {"PATCH /api/lecons/{id}/statut", "Changement de statut d'une leçon"},
            {"PATCH /api/lecons/{id}/terminer", "Leçon marquée comme faite"},
            {"POST /api/moniteur/exercices-td", "Création d'un travail dirigé"},
            {"PATCH /api/moniteur/exercices-td/{id}", "Modification d'un travail dirigé"},
            {"DELETE /api/moniteur/exercices-td/{id}", "Suppression d'un travail dirigé"},
            {"POST /api/moniteur/exercices-td/{id}/questions", "Ajout d'une question de travail dirigé"},
            {"PUT /api/moniteur/exercices-td/questions/{id}", "Modification d'une question de travail dirigé"},
            {"DELETE /api/moniteur/exercices-td/questions/{id}", "Suppression d'une question de travail dirigé"},
            {"POST /api/moniteur/seances/ajouter-eleves", "Ajout d'élèves à plusieurs séances de cours"},
            {"POST /api/moniteur/seances", "Ajout d'une séance de cours"},
            {"POST /api/publications-series/ajouter", "Ajout d'élèves à plusieurs séries en Travaux Dirigés"},
            {"POST /api/publications-series", "Publication d'une série en Travaux Dirigés"},
            {"PUT /api/publications-series/{id}", "Modification des élèves d'une série publiée"},
            {"DELETE /api/publications-series/{id}", "Retrait d'une série publiée"},
            {"PUT /api/moniteur/seances/{id}", "Modification d'une séance de cours"},
            {"DELETE /api/moniteur/seances/{id}", "Suppression d'une séance de cours"},
            {"PUT /api/moniteur/profil", "Modification de son profil"},
            {"POST /api/moniteur/upload/image", null},
            {"POST /api/moniteur/upload/audio", null},
            {"POST /api/moniteur/upload/video", null},
            {"POST /api/moniteurs", "Ajout d'un moniteur"},
            {"PUT /api/moniteurs/{id}", "Modification d'un moniteur"},
            {"DELETE /api/moniteurs/{id}", "Suppression d'un moniteur"},
            {"PATCH /api/moniteurs/{id}/toggle-actif", "Activation ou désactivation d'un moniteur"},
            {"POST /api/moniteurs/{id}/identifiants", "Nouveaux identifiants pour un moniteur"},
            {"POST /api/paiements", "Ajout d'un paiement"},
            {"PUT /api/paiements/{id}", "Modification d'un paiement"},
            {"DELETE /api/paiements/{id}", "Suppression d'un paiement"},
            {"PATCH /api/paiements/{id}/statut", "Validation ou refus d'un paiement"},
            {"POST /api/vehicules", "Ajout d'un véhicule"},
            {"PUT /api/vehicules/{id}", "Modification d'un véhicule"},
            {"DELETE /api/vehicules/{id}", "Suppression d'un véhicule"},
            {"PATCH /api/vehicules/{id}/statut", "Changement de statut d'un véhicule"},
        };
        for (String[] x : l) LIBELLES.put(x[0], x[1]);
    }

    private final JournalActionRepository journalRepository;
    private final EleveRepository eleveRepository;
    private final PaiementRepository paiementRepository;
    private final MoniteurRepository moniteurRepository;
    private final VehiculeRepository vehiculeRepository;
    private final ExamenRepository examenRepository;
    private final LeconRepository leconRepository;
    private final UserRepository userRepository;
    private final CoursRepository coursRepository;
    private final DemandeInscriptionRepository demandeRepository;
    private final SeanceRepository seanceRepository;
    private final ExerciceTDRepository exerciceTDRepository;

    public static boolean estTrace(User u) {
        return u != null && ROLES_TRACES.contains(u.getRole());
    }

    /** Chemin normalisé (« /api/eleves/{id} ») pour retrouver le libellé. */
    public static String modele(String chemin) {
        return ID.matcher(chemin).replaceAll("/{id}");
    }

    /** Libellé de l'action, ou Optional.empty() si elle n'est pas tracée. */
    public Optional<String> libelle(String methode, String chemin, Object reponse) {
        // Sauvegarde automatique du quiz en cours, à chaque réponse : pas une action à tracer
        if (chemin.startsWith("/api/eleve/quiz-en-cours")) return Optional.empty();
        if (chemin.startsWith("/api/public/visites")) return Optional.empty();   // registre à part (Visites)
        String cle = methode + " " + modele(chemin);
        if (LIBELLES.containsKey(cle)) {
            String l = LIBELLES.get(cle);
            if (l == null) return Optional.empty();
            return Optional.of(preciser(l, reponse));
        }
        return Optional.of(switch (methode) {          // chemin sans libellé connu : libellé générique
            case "POST" -> "Ajout"; case "PUT" -> "Modification"; case "PATCH" -> "Mise à jour";
            case "DELETE" -> "Suppression"; default -> methode;
        } + " (" + modele(chemin) + ")");
    }

    /** « Activation ou désactivation » et « Validation ou refus » deviennent précis grâce à la réponse. */
    private static String preciser(String libelle, Object reponse) {
        Boolean actif = reponse instanceof Map<?, ?> m && m.get("actif") instanceof Boolean b ? b
                : reponse instanceof Moniteur mo ? Boolean.valueOf(mo.isActif()) : null;
        if (actif != null && libelle.startsWith("Activation ou désactivation"))
            return (actif ? "Réactivation" : "Désactivation") + libelle.substring("Activation ou désactivation".length());
        if (reponse instanceof Map<?, ?> m && libelle.startsWith("Changement de rôle") && m.get("role") != null)
            return "SUPER_ADMIN".equals(String.valueOf(m.get("role"))) ? "Passage en super admin" : "Passage en administrateur";
        if (reponse instanceof Paiement p && libelle.startsWith("Validation ou refus") && p.getStatut() != null)
            return switch (p.getStatut().name()) {
                case "PAYE" -> "Validation d'un paiement"; case "ANNULE" -> "Refus d'un paiement"; default -> libelle;
            };
        return libelle;
    }

    /** Élément visé par le chemin (avant l'action : il existe encore s'il va être supprimé). */
    public String cibleDuChemin(String chemin) {
        try {
            Matcher m = Pattern.compile("^/api/([a-z-]+(?:/[a-z-]+)?)/(\\d+)").matcher(chemin);
            if (!m.find()) return null;
            String res = m.group(1);
            Long id = Long.valueOf(m.group(2));
            Function<Long, Optional<?>> trouver = switch (res) {
                case "eleves" -> eleveRepository::findById;
                case "paiements" -> paiementRepository::findById;
                case "moniteurs" -> moniteurRepository::findById;
                case "vehicules" -> vehiculeRepository::findById;
                case "examens" -> examenRepository::findById;
                case "lecons" -> leconRepository::findById;
                case "cours" -> coursRepository::findById;
                case "demandes-inscription" -> demandeRepository::findById;
                case "moniteur/seances" -> seanceRepository::findById;
                case "moniteur/exercices-td" -> exerciceTDRepository::findById;
                case "admin/secretaires", "admin/administrateurs", "comptes-bloques" -> userRepository::findById;
                default -> null;
            };
            return trouver == null ? null : trouver.apply(id).map(JournalService::decrire).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    /** Nom lisible d'un élément (entité renvoyée ou trouvée par son identifiant). */
    public static String decrire(Object o) {
        if (o == null) return null;
        if (o instanceof Eleve e) return nomComplet(e.getPrenom(), e.getNom());
        if (o instanceof Paiement p) return montant(p.getMontant()) + (p.getEleve() != null ? " · " + decrire(p.getEleve()) : "");
        if (o instanceof Moniteur m) return nomComplet(m.getPrenom(), m.getNom());
        if (o instanceof Vehicule v) return String.join(" ", Objects.toString(v.getMarque(), ""), Objects.toString(v.getModele(), ""),
                v.getImmatriculation() != null ? "(" + v.getImmatriculation() + ")" : "").trim();
        if (o instanceof Examen x) return (x.getType() != null ? x.getType().name().replace('_', ' ').toLowerCase() : "examen")
                + (x.getEleve() != null ? " · " + decrire(x.getEleve()) : "");
        if (o instanceof Lecon l) return "leçon du " + l.getDate() + (l.getEleve() != null ? " · " + decrire(l.getEleve()) : "");
        if (o instanceof Cours c) return c.getTitre();
        if (o instanceof Seance s) return "« " + s.getTitre() + " »" + (s.getDateHeure() != null ? " · " + s.getDateHeure().toLocalDate() : "");
        if (o instanceof sn.autoecole.dto.SeanceResponse s) return "« " + s.titre() + " »" + (s.dateHeure() != null ? " · " + s.dateHeure().toLocalDate() : "");
        if (o instanceof ExerciceTD x) return "« " + x.getTitre() + " »";
        if (o instanceof QuestionTD q) return q.getExercice() != null ? "question du travail dirigé « " + q.getExercice().getTitre() + " »" : null;
        if (o instanceof ProgressionCode pc) return "chapitre « " + pc.getChapitre().replace('-', ' ') + " » · meilleure note "
                + pc.getMeilleurScore() + "/" + pc.getTotal() + (pc.isReussi() ? " · validé" : "");
        if (o instanceof DemandeInscription d) return nomComplet(d.getPrenom(), d.getNom());
        if (o instanceof User u) return u.getNom() + " (" + u.getEmail() + ")";
        if (o instanceof Map<?, ?> m && m.get("nom") != null)
            return m.get("nom") + (m.get("identifiant") != null ? " (" + m.get("identifiant") + ")" : "");
        return null;
    }

    private static String nomComplet(String prenom, String nom) {
        return (Objects.toString(prenom, "") + " " + Objects.toString(nom, "")).trim();
    }

    private static String montant(BigDecimal m) {
        if (m == null) return "";
        return NumberFormat.getIntegerInstance(Locale.FRANCE).format(m).replace(' ', ' ').replace(' ', ' ') + " FCFA";
    }

    /** Enregistre une action ; une erreur d'écriture du journal ne bloque jamais l'action elle-même. */
    public void enregistrer(User u, String action, String cible, HttpServletRequest req) {
        if (!estTrace(u)) return;
        try {
            journalRepository.save(JournalAction.builder()
                    .date(LocalDateTime.now())
                    .utilisateurId(u.getId()).nom(u.getNom()).identifiant(u.getEmail()).role(u.getRole())
                    .action(couper(action, 160)).cible(couper(cible, 255))
                    .methode(req != null ? req.getMethod() : null)
                    .chemin(req != null ? couper(req.getRequestURI(), 255) : null)
                    .ip(req != null ? req.getRemoteAddr() : null)
                    .build());
        } catch (Exception e) {
            log.warn("Journal : action non enregistrée ({}) : {}", action, e.getMessage());
        }
    }

    private static String couper(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max - 1) + "…";
    }
}
