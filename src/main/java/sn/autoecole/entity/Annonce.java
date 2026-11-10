package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;
import sn.autoecole.enums.RoleUser;

import java.time.LocalDateTime;

/**
 * Annonce écrite par le super admin, un administrateur, le secrétariat ou un moniteur, adressée à
 * tout le monde, à tous les élèves, aux élèves d'un bureau, aux élèves d'un moniteur, ou au personnel.
 */
@Entity
@Table(name = "annonces", indexes = @Index(name = "idx_annonce_date", columnList = "cree_le"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Annonce {

    /** TOUS : élèves et personnel ; BUREAU : valeur = code du bureau ; MONITEUR : valeur = id du moniteur. */
    public enum Cible { TOUS, ELEVES, BUREAU, MONITEUR, PERSONNEL }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String titre;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenu;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Cible cible;

    @Column(length = 40)
    private String valeur;

    @Column(name = "auteur_id")
    private Long auteurId;

    @Column(length = 120)
    private String auteurNom;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private RoleUser auteurRole;

    @Column(name = "cree_le", nullable = false)
    private LocalDateTime creeLe;
}
