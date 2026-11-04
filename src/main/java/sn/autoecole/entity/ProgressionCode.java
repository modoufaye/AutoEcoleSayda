package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Résultat d'un élève à un chapitre des cours de code (Signalisation, Priorité) : meilleure note gardée. */
@Entity
@Table(name = "progression_code", uniqueConstraints = @UniqueConstraint(columnNames = {"eleve_id", "chapitre"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProgressionCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "eleve_id", nullable = false)
    private Long eleveId;

    /** Identifiant du chapitre (contenu/signalisation.js, contenu/priorite.js), ex. « danger ». */
    @Column(nullable = false, length = 40)
    private String chapitre;

    @Column(name = "meilleur_score", nullable = false)
    private int meilleurScore;

    @Column(nullable = false)
    private int total;

    /** Au moins 70 % de bonnes réponses une fois : chapitre validé. */
    @Column(nullable = false)
    private boolean reussi;

    @Column(nullable = false)
    private int tentatives;

    @Column(name = "derniere_tentative", nullable = false)
    private LocalDateTime derniereTentative;
}
