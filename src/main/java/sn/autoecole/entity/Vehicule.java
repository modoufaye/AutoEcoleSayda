package sn.autoecole.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import sn.autoecole.enums.CategoriePermis;
import sn.autoecole.enums.StatutVehicule;

import java.time.LocalDate;

@Entity
@Table(name = "vehicules")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Vehicule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "L'immatriculation est obligatoire")
    @Column(unique = true, nullable = false)
    private String immatriculation;

    @NotBlank(message = "La marque est obligatoire")
    @Column(nullable = false)
    private String marque;

    @NotBlank(message = "Le modèle est obligatoire")
    @Column(nullable = false)
    private String modele;

    @Min(value = 1990, message = "L'année doit être supérieure à 1990")
    private int annee;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "La catégorie est obligatoire")
    private CategoriePermis categorie;

    @Min(value = 0)
    @Builder.Default
    private int kilometrage = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutVehicule statut = StatutVehicule.DISPONIBLE;

    private String observations;

    private LocalDate prochainEntretien;

    private LocalDate dateAssurance;

    private Integer montantAssurance;

    private Integer dureeAssurance;

    private LocalDate dateVisiteTechnique;
}
