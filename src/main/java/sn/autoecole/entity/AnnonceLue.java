package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Annonce déjà lue par un compte (pour la pastille « non lues »). */
@Entity
@Table(name = "annonces_lues", uniqueConstraints = @UniqueConstraint(name = "uk_annonce_lue", columnNames = {"annonce_id", "user_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AnnonceLue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "annonce_id", nullable = false)
    private Long annonceId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private LocalDateTime luLe;
}
