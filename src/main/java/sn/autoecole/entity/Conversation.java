package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Conversation privée d'un élève : avec l'auto-école (ECOLE, boîte partagée par le super admin, les
 * administrateurs et le secrétariat) ou avec son moniteur (MONITEUR). Une seule par élève et par
 * interlocuteur. eleveLuLe / equipeLuLe : dernière lecture de chaque côté (messages non lus).
 */
@Entity
@Table(name = "conversations", uniqueConstraints = @UniqueConstraint(name = "uk_conversation", columnNames = {"eleve_id", "type", "moniteur_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Conversation {

    public enum Type { ECOLE, MONITEUR }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "eleve_id")
    private Eleve eleve;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Type type;

    /** Fiche du moniteur (conversation MONITEUR seulement). */
    @Column(name = "moniteur_id")
    private Long moniteurId;

    @Column(nullable = false)
    private LocalDateTime creeLe;

    private LocalDateTime dernierMessageLe;
    private LocalDateTime eleveLuLe;
    private LocalDateTime equipeLuLe;
}
