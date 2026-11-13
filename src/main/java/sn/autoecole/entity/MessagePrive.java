package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Message d'une conversation privée ; cote : écrit par l'élève ou par l'équipe (auto-école, moniteur). */
@Entity
@Table(name = "messages_prives", indexes = @Index(name = "idx_message_conversation", columnList = "conversation_id, envoye_le"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MessagePrive {

    public enum Cote { ELEVE, EQUIPE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conversation_id", nullable = false)
    private Long conversationId;

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

    /** Durée du message vocal, en secondes. */
    private Integer audioDuree;
}
