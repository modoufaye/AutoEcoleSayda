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

    /** Formules du permis (Standard, Premium, Prestige, Excellence) et leurs tranches. */
    @Column(columnDefinition = "TEXT")
    @Convert(converter = FormulesPermisConverter.class)
    private List<FormulePermis> formules;

    /** Moniteur assigné d'office aux nouveaux inscrits (celui des cours de code) ; null : aucun. */
    @Column(name = "moniteur_par_defaut_id")
    private Long moniteurParDefautId;
}
