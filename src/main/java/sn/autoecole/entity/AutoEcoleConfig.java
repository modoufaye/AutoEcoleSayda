package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

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

    @Builder.Default
    @Column(precision = 12, scale = 2)
    private BigDecimal tarifInscription = BigDecimal.ZERO;

    @Builder.Default
    @Column(precision = 12, scale = 2)
    private BigDecimal tarifHeureCode = BigDecimal.ZERO;

    @Builder.Default
    @Column(precision = 12, scale = 2)
    private BigDecimal tarifHeureConduite = BigDecimal.ZERO;
}
