package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Explication enregistrée en wolof d'un chapitre du cours de code ou de « Apprendre à conduire »
 * (bouton « Wolof » à côté de « Écouter »). Une par chapitre ; l'audio est dans /uploads/audios.
 */
@Entity
@Table(name = "audios_wolof", uniqueConstraints = @UniqueConstraint(name = "uk_audio_wolof_chapitre", columnNames = "chapitre"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AudioWolof {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String chapitre;

    @Column(nullable = false, length = 300)
    private String url;

    /** Qui l'a déposé, et quand. */
    @Column(length = 120)
    private String parNom;

    @Column(nullable = false)
    private LocalDateTime majLe;
}
