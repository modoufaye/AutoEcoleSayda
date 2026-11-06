package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Quiz commencé par un élève et pas encore fini : il le reprend sur n'importe quel appareil. */
@Entity
@Table(name = "quiz_en_cours", uniqueConstraints = @UniqueConstraint(columnNames = {"eleve_id", "cle"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class QuizEnCours {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "eleve_id", nullable = false)
    private Long eleveId;

    /** Quiz concerné, ex. « chapitre:danger », « seance:12 », « serie:serie-b1:examen ». */
    @Column(nullable = false, length = 80)
    private String cle;

    /** État du quiz (questions tirées, question en cours, score, erreurs), en JSON. */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String etat;

    @Column(name = "maj_le", nullable = false)
    private LocalDateTime majLe;
}
