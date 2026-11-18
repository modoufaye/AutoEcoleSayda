package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Discussion privée entre un moniteur et une personne de l'auto-école (agentId : super admin,
 * administrateur ou secrétaire ; elle seule la voit). Une seule par moniteur et par personne. moniteurLuLe / ecoleLuLe : dernière
 * lecture de chaque côté (messages non lus).
 */
@Entity
@Table(name = "discussions_equipe")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DiscussionEquipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "moniteur_id", nullable = false)
    private Long moniteurId;

    @Column(name = "agent_id")
    private Long agentId;

    @Column(nullable = false)
    private LocalDateTime creeLe;

    private LocalDateTime dernierMessageLe;
    private LocalDateTime moniteurLuLe;
    private LocalDateTime ecoleLuLe;
}
