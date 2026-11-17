package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Discussion privée entre un moniteur et l'auto-école (boîte partagée du super admin, des
 * administrateurs et du secrétariat). Une seule par moniteur. moniteurLuLe / ecoleLuLe : dernière
 * lecture de chaque côté (messages non lus).
 */
@Entity
@Table(name = "discussions_equipe", uniqueConstraints = @UniqueConstraint(name = "uk_discussion_equipe_moniteur", columnNames = "moniteur_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DiscussionEquipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "moniteur_id", nullable = false)
    private Long moniteurId;

    @Column(nullable = false)
    private LocalDateTime creeLe;

    private LocalDateTime dernierMessageLe;
    private LocalDateTime moniteurLuLe;
    private LocalDateTime ecoleLuLe;
}
