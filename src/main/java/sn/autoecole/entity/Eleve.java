package sn.autoecole.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import sn.autoecole.enums.BoiteVitesse;
import sn.autoecole.enums.TypeFormation;
import sn.autoecole.enums.CategoriePermis;
import sn.autoecole.enums.StatutEleve;

import java.time.LocalDate;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "eleves")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Eleve {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom est obligatoire")
    @Column(nullable = false)
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    @Column(nullable = false)
    private String prenom;

    @Column(name = "date_naissance")
    private LocalDate dateNaissance;

    // Normalisé (Telephones) : c'est l'identifiant de connexion de l'élève.
    private String telephone;

    private String adresse;

    /** Code du bureau qui suit l'élève (voir Bureau). */
    @Column(name = "site")
    private String site;

    // Où l'élève s'est inscrit (bureau ou en ligne), distinct du bureau qui le suit ensuite.
    @Column(name = "lieu_inscription")
    private String lieuInscription;

    // Ancien identifiant de connexion, plus saisi : conservé pour les fiches existantes.
    @Email(message = "Format d'email invalide")
    private String email;

    @Column(name = "numero_cni", unique = true)
    private String numeroCni;

    // Formation suivie ; null (fiches antérieures) = permis. Voir estPerfectionnement().
    @Enumerated(EnumType.STRING)
    @Column(name = "type_formation")
    private TypeFormation typeFormation;

    // Perfectionnement seulement : boîte manuelle ou automatique.
    @Enumerated(EnumType.STRING)
    @Column(name = "boite_vitesse")
    private BoiteVitesse boiteVitesse;

    // Perfectionnement : toujours B (voiture), fixé par le service.
    @Enumerated(EnumType.STRING)
    @Column(name = "categorie_permis", nullable = false)
    @NotNull(message = "La catégorie de permis est obligatoire")
    private CategoriePermis categoriePermis;

    // Chemin renvoyé par l'upload d'image (/uploads/images/…), null sans photo.
    @Column(name = "photo_url")
    private String photoUrl;

    // Prix total de la formation convenu avec l'élève (null pour les fiches antérieures).
    // Acompte = 1re tranche ; reliquat = total − montants payés.
    @Column(name = "montant_total", precision = 12, scale = 2)
    private java.math.BigDecimal montantTotal;

    // Formule choisie à l'inscription (ex. « Premium », « 15 cours · automatique ») ; null : montant libre.
    @Column(length = 80)
    private String formule;

    @Column(name = "date_inscription", nullable = false)
    private LocalDate dateInscription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutEleve statut = StatutEleve.EN_COURS;

    @Column(name = "nombre_lecons_code")
    @Builder.Default
    private int nombreLeconsCode = 0;

    @Column(name = "nombre_lecons_conduite")
    @Builder.Default
    private int nombreLeconsConduite = 0;

    // ── Documents dossier ───────────────────────────────────
    @Column(name = "doc_cert_residence", columnDefinition = "boolean default false")
    @Builder.Default private boolean docCertResidence = false;

    @Column(name = "doc_cni_legalisee", columnDefinition = "boolean default false")
    @Builder.Default private boolean docCniLegalisee = false;

    @Column(name = "doc_groupe_sanguin", columnDefinition = "boolean default false")
    @Builder.Default private boolean docGroupeSanguin = false;

    @Column(name = "doc_visite_medicale", columnDefinition = "boolean default false")
    @Builder.Default private boolean docVisiteMedicale = false;

    @Column(name = "doc_photos", columnDefinition = "boolean default false")
    @Builder.Default private boolean docPhotos = false;

    @Column(name = "doc_timbre", columnDefinition = "boolean default false")
    @Builder.Default private boolean docTimbre = false;

    @Column(name = "doc_enrolement", columnDefinition = "boolean default false")
    @Builder.Default private boolean docEnrolement = false;

    @Column(name = "doc_delivrance", columnDefinition = "boolean default false")
    @Builder.Default private boolean docDelivrance = false;

    // ── Archivage ── l'élève sort des listes mais tout son historique (paiements, leçons…) est conservé.
    @Column(name = "archive", columnDefinition = "boolean default false")
    @Builder.Default private boolean archive = false;

    @Column(name = "date_archivage")
    private LocalDate dateArchivage;

    // ── Message de bienvenue ── envoyé sur WhatsApp avec les identifiants : la fiche propose
    // ensuite « Écrire à … » au lieu d'un nouvel envoi (qui changerait le mot de passe).
    @Column(name = "bienvenue_envoyee_le")
    private LocalDateTime bienvenueEnvoyeeLe;

    @Column(name = "bienvenue_envoyee_par", length = 120)
    private String bienvenueEnvoyeePar;

    // Première fois que l'élève a utilisé son compte (PresenceService) : il a donc ses
    // identifiants, la fiche propose aussi « Écrire à … » au lieu du message de bienvenue.
    @Column(name = "premiere_connexion_le")
    private LocalDateTime premiereConnexionLe;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "moniteur_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "categoriesAutorisees"})
    private Moniteur moniteur;

    /** Conduite seule : pas de cours ni d'examen de code, pas de dossier du permis. */
    @com.fasterxml.jackson.annotation.JsonIgnore
    public boolean estPerfectionnement() {
        return typeFormation == TypeFormation.PERFECTIONNEMENT;
    }

    @PrePersist
    private void prePersist() {
        if (dateInscription == null) {
            dateInscription = LocalDate.now();
        }
        if (statut == null) {
            statut = StatutEleve.EN_COURS;
        }
    }
}
