package sn.autoecole.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import sn.autoecole.enums.CategoriePermis;
import sn.autoecole.enums.StatutEleve;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class EleveRequest {

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;

    @NotNull(message = "La date de naissance est obligatoire")
    private LocalDate dateNaissance;

    @NotBlank(message = "Le téléphone est obligatoire")
    private String telephone;

    private String adresse;

    @Email(message = "Format d'email invalide")
    private String email;

    private String numeroCni;

    @NotNull(message = "La catégorie de permis est obligatoire")
    private CategoriePermis categoriePermis;

    private StatutEleve statut;

    private Long moniteurId;

    private BigDecimal montantAvance;

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
