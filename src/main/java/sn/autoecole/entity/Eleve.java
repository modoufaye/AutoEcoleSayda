package sn.autoecole.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import sn.autoecole.enums.CategoriePermis;
import sn.autoecole.enums.Site;
import sn.autoecole.enums.StatutEleve;

import java.time.LocalDate;
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

    @Enumerated(EnumType.STRING)
    @Column(name = "site")
    private Site site;

    // Où l'élève s'est inscrit (bureau ou en ligne), distinct du bureau qui le suit ensuite.
    @Enumerated(EnumType.STRING)
    @Column(name = "lieu_inscription")
    private Site lieuInscription;

    // Ancien identifiant de connexion, plus saisi : conservé pour les fiches existantes.
    @Email(message = "Format d'email invalide")
    private String email;

    @Column(name = "numero_cni", unique = true)
    private String numeroCni;

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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "moniteur_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "categoriesAutorisees"})
    private Moniteur moniteur;

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
