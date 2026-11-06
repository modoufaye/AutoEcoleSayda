package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;
import sn.autoecole.enums.StatutSeance;
import sn.autoecole.enums.ThemeSeance;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
// eleves référence Eleve (profil auto-école), pas User (compte auth)

@Entity
@Table(name = "seances")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Seance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    private LocalDateTime dateHeure;

    @Enumerated(EnumType.STRING)
    private ThemeSeance theme;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutSeance statut = StatutSeance.BROUILLON;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "moniteur_id")
    private User moniteur;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "seance_eleve_profiles",
        joinColumns = @JoinColumn(name = "seance_id"),
        inverseJoinColumns = @JoinColumn(name = "eleve_id")
    )
    @Builder.Default
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private List<Eleve> eleves = new ArrayList<>();

    @OneToMany(mappedBy = "seance", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("ordre ASC")
    @Builder.Default
    private List<BlocContenu> blocs = new ArrayList<>();

    /** Cours de code publiés dans la séance (chapitres, ou panneaux n° de à a) ; l'élève les étudie puis passe le quiz. */
    @Convert(converter = ProgrammeCodeConverter.class)
    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private List<PartieCode> programme = new ArrayList<>();

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
