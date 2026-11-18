package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Semaine ouverte aux réservations de conduite des élèves (son lundi). L'administration ou le
 * secrétariat l'ouvre après avoir vu les disponibilités des moniteurs ; sans elle, pas de réservation.
 */
@Entity
@Table(name = "semaines_reservation", uniqueConstraints = @UniqueConstraint(name = "uk_semaine_reservation_lundi", columnNames = "lundi"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SemaineReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate lundi;

    @Column(nullable = false)
    private LocalDateTime ouverteLe;

    @Column(length = 120)
    private String ouvertePar;
}
