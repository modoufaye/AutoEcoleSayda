package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** Somme remise à un moniteur de conduite pour son carburant ; il la justifie ensuite par ses pleins. */
@Entity
@Table(name = "dotations_carburant")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DotationCarburant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "moniteur_id", nullable = false)
    private Moniteur moniteur;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private Integer montant;

    @Column(length = 300)
    private String note;

    @Column(length = 120)
    private String donneePar;

    private LocalDateTime creeLe;
}
