package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "auto_ecole_config")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AutoEcoleConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String adresse;
    private String telephone;
    private String email;
    private String logoUrl;
    private String signatureUrl;

    /* Page d'accueil publique : ville, année de création, chiffres clés et horaires.
       Un champ vide n'est pas affiché. */
    private String ville;
    private Integer anneeCreation;
    private String elevesFormes;
    private String tauxReussite;
    private String nombreMoniteurs;
    private String horaires;
    /** Slogan en tête de l'accueil (« …, … » : la partie après la virgule est en couleur). Vide : slogan générique. */
    @Column(length = 300)
    private String slogan;

    /** Affiches du diaporama « Nos formations ». Aucune : la section n'est pas affichée. */
    @Convert(converter = AffichesConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<Affiche> affiches;

    /** Liens marchands affichés à l'élève pour payer (Wave Business / Orange Money). */
    @Column(length = 500)
    private String lienWave;

    @Column(length = 500)
    private String lienOrangeMoney;

    @Builder.Default
    @Column(precision = 12, scale = 2)
    private BigDecimal tarifInscription = BigDecimal.ZERO;

    @Builder.Default
    @Column(precision = 12, scale = 2)
    private BigDecimal tarifHeureCode = BigDecimal.ZERO;

    @Builder.Default
    @Column(precision = 12, scale = 2)
    private BigDecimal tarifHeureConduite = BigDecimal.ZERO;

    /** Formules du permis B (Standard, Premium, Prestige, Excellence) et leurs tranches. */
    @Column(columnDefinition = "TEXT")
    @Convert(converter = FormulesPermisConverter.class)
    private List<FormulePermis> formules;

    /** Formule des permis C et D (poids lourd, transport en commun) : une seule, Standard. */
    @Column(name = "formules_poids_lourd", columnDefinition = "TEXT")
    @Convert(converter = FormulesPermisConverter.class)
    private List<FormulePermis> formulesPoidsLourd;

    /** Formule du permis A (moto) : une seule, Standard. */
    @Column(name = "formules_moto", columnDefinition = "TEXT")
    @Convert(converter = FormulesPermisConverter.class)
    private List<FormulePermis> formulesMoto;

    /** Formules de perfectionnement (boîte automatique ou manuelle, nombre de cours). */
    @Column(columnDefinition = "TEXT")
    @Convert(converter = FormulesPerfectionnementConverter.class)
    private List<FormulePerfectionnement> formulesPerfectionnement;

    /** Moniteur assigné d'office aux nouveaux inscrits (celui des cours de code) ; null : aucun. */
    @Column(name = "moniteur_par_defaut_id")
    private Long moniteurParDefautId;
}
