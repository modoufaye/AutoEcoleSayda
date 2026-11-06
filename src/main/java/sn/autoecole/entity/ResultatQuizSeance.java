package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Quiz d'une séance de code passé par un élève : dernier essai, meilleure note et erreurs du dernier essai. */
@Entity
@Table(name = "resultats_quiz_seance", uniqueConstraints = @UniqueConstraint(columnNames = {"seance_id", "eleve_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ResultatQuizSeance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "seance_id", nullable = false)
    private Long seanceId;

    @Column(name = "eleve_id", nullable = false)
    private Long eleveId;

    @Column(nullable = false)
    private int score;

    @Column(nullable = false)
    private int total;

    @Column(name = "meilleur_score", nullable = false)
    private int meilleurScore;

    @Column(name = "meilleur_total", nullable = false)
    private int meilleurTotal;

    /** Au moins 70 % de bonnes réponses une fois. */
    @Column(nullable = false)
    private boolean reussi;

    @Column(nullable = false)
    private int tentatives;

    /** Questions manquées au dernier essai, une par ligne (« question → bonne réponse »). */
    @Column(columnDefinition = "TEXT")
    private String erreurs;

    @Column(name = "derniere_tentative", nullable = false)
    private LocalDateTime derniereTentative;
}
