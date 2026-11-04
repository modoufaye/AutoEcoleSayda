package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;
import sn.autoecole.enums.RoleUser;

import java.time.LocalDateTime;

/**
 * Une action faite par le super admin, un administrateur ou le secrétariat (voir JournalService).
 * Le nom et le rôle sont copiés au moment de l'action : l'entrée reste lisible si le compte
 * change de nom ou est supprimé. Aucun contenu de formulaire n'est conservé.
 */
@Entity
@Table(name = "journal_actions", indexes = {
        @Index(name = "idx_journal_date", columnList = "date"),
        @Index(name = "idx_journal_utilisateur", columnList = "utilisateur_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JournalAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime date;

    @Column(name = "utilisateur_id")
    private Long utilisateurId;

    @Column(nullable = false, length = 120)
    private String nom;

    /** Téléphone ou email de connexion. */
    @Column(length = 120)
    private String identifiant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoleUser role;

    /** Libellé lisible, ex. « Suppression d'un paiement ». */
    @Column(nullable = false, length = 160)
    private String action;

    /** Élément concerné, ex. « 30 000 FCFA · Awa Diop ». */
    @Column(length = 255)
    private String cible;

    @Column(length = 8)
    private String methode;

    @Column(length = 255)
    private String chemin;

    @Column(length = 64)
    private String ip;
}
