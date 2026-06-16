package sn.autoecole.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import sn.autoecole.enums.CategoriePermis;
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

    @NotNull(message = "La date de naissance est obligatoire")
    @Column(name = "date_naissance", nullable = false)
    private LocalDate dateNaissance;

    @NotBlank(message = "Le numéro de téléphone est obligatoire")
    @Column(nullable = false)
    private String telephone;

    private String adresse;

    @Email(message = "Format d'email invalide")
    private String email;

    @Column(name = "numero_cni", unique = true)
    private String numeroCni;

    @Enumerated(EnumType.STRING)
    @Column(name = "categorie_permis", nullable = false)
    @NotNull(message = "La catégorie de permis est obligatoire")
    private CategoriePermis categoriePermis;

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
