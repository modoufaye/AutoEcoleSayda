package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Conversation privée d'un élève : avec une personne de l'auto-école (ECOLE : super admin,
 * administrateur ou secrétaire, agentId, que l'élève choisit ; elle seule la voit) ou avec son
 * moniteur (MONITEUR). Une seule par élève et par interlocuteur. eleveLuLe / equipeLuLe : dernière lecture de chaque côté (messages non lus).
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

    /** Compte de la personne de l'auto-école (conversation ECOLE) : elle seule voit la conversation. */
    @Column(name = "agent_id")
    private Long agentId;

    /** Fiche du moniteur (conversation MONITEUR seulement). */
    @Column(name = "moniteur_id")
    private Long moniteurId;

    @Column(nullable = false)
    private LocalDateTime creeLe;

    private LocalDateTime dernierMessageLe;
    private LocalDateTime eleveLuLe;
    private LocalDateTime equipeLuLe;
}
