package sn.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Ouverture d'une page publique du site (accueil, connexion, inscription en ligne) ou essai
 * d'inscription en ligne, vus par le super admin dans Journal → Visites. Gardée 90 jours.
 */
@Entity
@Table(name = "visites", indexes = {
        @Index(name = "idx_visite_date", columnList = "date"),
        @Index(name = "idx_visite_ip", columnList = "ip")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Visite {

    /** VISITE : page ouverte ; INSCRIPTION : formulaire d'inscription envoyé (réussi ou non). */
    public enum Type { VISITE, INSCRIPTION }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Type type;

    @Column(nullable = false, length = 45)
    private String ip;

    /** Page ouverte (/, /login, /inscription). */
    @Column(nullable = false, length = 60)
    private String page;

    /** Navigateur et appareil (en-tête User-Agent, tronqué). */
    @Column(length = 300)
    private String navigateur;

    /** Site d'où vient le visiteur (WhatsApp, Facebook, Google…), si le navigateur le donne. */
    @Column(length = 200)
    private String provenance;

    /** Essai d'inscription : nom et téléphone saisis, puis le résultat (demande envoyée, erreur, robot). */
    @Column(length = 120)
    private String nom;

    @Column(length = 30)
    private String telephone;

    @Column(length = 200)
    private String resultat;
}
