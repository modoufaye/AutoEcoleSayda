package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Plein déclaré par un moniteur (avec la photo du reçu), puis validé ou refusé par
 * l'administration ou le secrétariat. Seuls les pleins validés justifient la dotation.
 */
@Entity
@Table(name = "pleins_carburant")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PleinCarburant {

    public static final String EN_ATTENTE = "EN_ATTENTE", VALIDE = "VALIDE", REFUSE = "REFUSE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "moniteur_id", nullable = false)
    private Moniteur moniteur;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicule_id")
    private Vehicule vehicule;

    @Column(nullable = false)
    private LocalDate date;

    @Column(precision = 7, scale = 2)
    private BigDecimal litres;

    @Column(nullable = false)
    private Integer montant;

    // Compteur du véhicule au moment du plein (sert à la consommation)
    private Integer kilometrage;

    @Column(length = 120)
    private String station;

    @Column(length = 200)
    private String recuUrl;

    @Column(nullable = false, length = 20)
    private String statut;

    @Column(length = 300)
    private String motifRefus;

    @Column(length = 120)
    private String traitePar;

    private LocalDateTime traiteLe;

    private LocalDateTime creeLe;
}
