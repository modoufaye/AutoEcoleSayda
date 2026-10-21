package sn.autoecole.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import sn.autoecole.enums.MoyenPaiement;
import sn.autoecole.enums.StatutPaiement;
import sn.autoecole.enums.TypePaiement;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "paiements")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String reference;

    @NotNull(message = "La date est obligatoire")
    @Column(nullable = false)
    private LocalDate date;

    @NotNull(message = "Le montant est obligatoire")
    @DecimalMin(value = "0.0", inclusive = false, message = "Le montant doit être positif")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal montant;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "eleve_id", nullable = false)
    @NotNull(message = "L'élève est obligatoire")
    private Eleve eleve;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Le type de paiement est obligatoire")
    @Column(name = "type_paiement", nullable = false)
    private TypePaiement typePaiement;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutPaiement statut = StatutPaiement.PAYE;

    @Column(length = 300)
    private String description;

    /** Renseigné pour les paiements mobiles déclarés par l'élève ; null pour les saisies admin historiques. */
    @Enumerated(EnumType.STRING)
    @Column(name = "moyen_paiement")
    private MoyenPaiement moyenPaiement;

    @Column(name = "transaction_id", length = 100)
    private String transactionId;

    @PrePersist
    private void prePersist() {
        if (date == null) {
            date = LocalDate.now();
        }
        if (reference == null) {
            reference = "PAY-" + System.currentTimeMillis();
        }
    }
}
