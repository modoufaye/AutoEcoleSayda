package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Message d'une discussion moniteur ↔ auto-école ; cote : écrit par le moniteur ou par l'auto-école. */
@Entity
@Table(name = "messages_equipe", indexes = @Index(name = "idx_message_equipe_discussion", columnList = "discussion_id, envoye_le"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MessageEquipe {

    public enum Cote { MONITEUR, ECOLE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "discussion_id", nullable = false)
    private Long discussionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Cote cote;

    @Column(name = "auteur_id")
    private Long auteurId;

    @Column(length = 120)
    private String auteurNom;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String texte;

    @Column(name = "envoye_le", nullable = false)
    private LocalDateTime envoyeLe;

    /** Message vocal : nom du fichier dans uploads/messages-vocaux (privé, servi après contrôle d'accès). */
    @Column(length = 80)
    private String audio;

    private Integer audioDuree;

    @Column(name = "modifie_le")
    private LocalDateTime modifieLe;
}
