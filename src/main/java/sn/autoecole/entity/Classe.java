package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;
import sn.autoecole.enums.RoleUser;

import java.time.LocalDateTime;

/**
 * Classe : groupe d'élèves arrivés ensemble (« Groupe de novembre »), pour leur envoyer d'un coup
 * séances, annales et séries, annonces ou examens. Un élève est dans une seule classe à la fois
 * (eleves.classe_id). Créée par l'administration, le secrétariat ou un moniteur (pour ses élèves).
 */
@Entity
@Table(name = "classes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Classe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String nom;

    private Long auteurId;
    private String auteurNom;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private RoleUser auteurRole;

    @Builder.Default
    private LocalDateTime creeLe = LocalDateTime.now();
}
