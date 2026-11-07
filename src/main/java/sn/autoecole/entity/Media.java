package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Vidéo ou audio de la médiathèque, en français ou en wolof, déposé par le super admin, un
 * administrateur ou un moniteur pour être publié dans les séances de cours.
 */
@Entity
@Table(name = "medias", indexes = @Index(name = "idx_media_date", columnList = "cree_le"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Media {

    public enum Type { VIDEO, AUDIO }
    public enum Langue { FRANCAIS, WOLOF }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Type type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Langue langue;

    @Column(nullable = false, length = 150)
    private String titre;

    @Column(length = 500)
    private String description;

    /** /uploads/videos/… ou /uploads/audios/… */
    @Column(nullable = false, length = 300)
    private String url;

    /** Ancienne option (médiathèque des élèves, retirée) : colonne gardée, toujours fausse. */
    @Column(nullable = false)
    private boolean visibleEleves;

    @Column(name = "auteur_id")
    private Long auteurId;

    @Column(length = 120)
    private String auteurNom;

    @Column(name = "cree_le", nullable = false)
    private LocalDateTime creeLe;
}
