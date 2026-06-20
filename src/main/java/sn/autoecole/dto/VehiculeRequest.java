package sn.autoecole.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import sn.autoecole.enums.CategoriePermis;
import sn.autoecole.enums.StatutVehicule;

import java.time.LocalDate;

@Data
public class VehiculeRequest {

    @NotBlank(message = "L'immatriculation est obligatoire")
    private String immatriculation;

    @NotBlank(message = "La marque est obligatoire")
    private String marque;

    @NotBlank(message = "Le modèle est obligatoire")
    private String modele;

    @Min(value = 1990, message = "L'année doit être >= 1990")
    private int annee;

    @NotNull(message = "La catégorie est obligatoire")
    private CategoriePermis categorie;

    @Min(value = 0)
    private int kilometrage;

    private StatutVehicule statut;

    private String observations;

    private LocalDate prochainEntretien;

    private LocalDate dateAssurance;

    private Integer montantAssurance;

    private Integer dureeAssurance;

    private LocalDate dateVisiteTechnique;
}
