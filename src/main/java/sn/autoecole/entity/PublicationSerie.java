package sn.autoecole.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Travaux Dirigés : série d'examen ou catalogue des annales (contenu/seriesExamen.js,
 * contenu/annales.js) publié par le personnel pour des élèves, dans un mode : ENTRAINEMENT
 * (correction à chaque question) ou EXAMEN (examen blanc chronométré, note enregistrée).
 */
@Entity
@Table(name = "publications_series")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PublicationSerie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String serie;

    @Column(nullable = false)
    private String mode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auteur_id")
    private User auteur;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "publication_serie_eleves",
        joinColumns = @JoinColumn(name = "publication_id"),
        inverseJoinColumns = @JoinColumn(name = "eleve_id"))
    @Builder.Default
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private List<Eleve> eleves = new ArrayList<>();

    @Builder.Default
    private LocalDateTime creeLe = LocalDateTime.now();
}
