package sn.autoecole.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import sn.autoecole.enums.BoiteVitesse;
import sn.autoecole.enums.TypeFormation;
import sn.autoecole.enums.CategoriePermis;
import sn.autoecole.enums.MoyenPaiement;
import sn.autoecole.enums.Site;
import sn.autoecole.enums.StatutEleve;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class EleveRequest {

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;

    // Facultative : les élèves importés d'un fichier Excel n'en ont pas encore.
    private LocalDate dateNaissance;

    /** Élèves déjà inscrits avant leur saisie dans l'application. Absente : aujourd'hui. */
    @PastOrPresent(message = "La date d'inscription ne peut pas être dans le futur")
    private LocalDate dateInscription;

    // Identifiant de connexion de l'élève ; facultatif (import) : sans lui, pas de compte.
    private String telephone;

    private String adresse;

    @NotNull(message = "Le bureau est obligatoire")
    private Site site;

    /** Absent : le bureau. */
    private Site lieuInscription;

    private String numeroCni;

    // Seulement une image envoyée sur le serveur : pas d'URL externe arbitraire.
    @Pattern(regexp = "/uploads/images/[\\w.-]+", message = "Photo invalide")
    private String photoUrl;

    /** Absente : permis. */
    private TypeFormation typeFormation;

    /** Obligatoire pour un perfectionnement. */
    private BoiteVitesse boiteVitesse;

    /** Obligatoire pour un permis ; perfectionnement : toujours B (fixé par le service). */
    private CategoriePermis categoriePermis;

    private StatutEleve statut;

    private Long moniteurId;

    private BigDecimal montantAvance;

    /** Mode de règlement de l'acompte (espèces par défaut). */
    private MoyenPaiement moyenAcompte;

    @PositiveOrZero(message = "Le montant total doit être positif")
    private BigDecimal montantTotal;

    // Documents dossier
    private boolean docCertResidence;
    private boolean docCniLegalisee;
    private boolean docGroupeSanguin;
    private boolean docVisiteMedicale;
    private boolean docPhotos;
    private boolean docTimbre;
    private boolean docEnrolement;
    private boolean docDelivrance;
}
